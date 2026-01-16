/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import type { Config } from '../config/config.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import { ToolErrorType } from './tool-error.js';
import type { ToolInvocation, ToolResult, ToolResultDisplay } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { getErrorMessage } from '../utils/errors.js';
import type {
  ShellExecutionConfig,
  ShellOutputEvent,
} from '../services/shellExecutionService.js';
import { ShellExecutionService } from '../services/shellExecutionService.js';
import { formatMemoryUsage } from '../utils/formatters.js';
import type { AnsiOutput } from '../utils/terminalSerializer.js';

export const BASH_OUTPUT_UPDATE_INTERVAL_MS = 1000;

export interface BashToolParams {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  is_background?: boolean;
  description?: string;
  terminal?: {
    width?: number;
    height?: number;
    showColor?: boolean;
  };
}

export class BashToolInvocation extends BaseToolInvocation<
  BashToolParams,
  ToolResult
> {
  constructor(
    private readonly config: Config,
    params: BashToolParams,
  ) {
    super(params);
  }

  getDescription(): string {
    let description = `${this.params.command}`;

    if (this.params.cwd) {
      description += ` [in ${this.params.cwd}]`;
    }

    if (this.params.is_background) {
      description += ` [background]`;
    }

    if (this.params.description) {
      description += ` (${this.params.description.replace(/\n/g, ' ')})`;
    }

    return description;
  }

  async execute(
    signal: AbortSignal,
    updateOutput?: (output: ToolResultDisplay) => void,
    shellExecutionConfig?: ShellExecutionConfig,
  ): Promise<ToolResult> {
    if (signal.aborted) {
      return {
        llmContent: 'Command was cancelled before execution.',
        returnDisplay: 'Cancelled',
      };
    }

    const cwd = this.params.cwd || this.config.getTargetDir();
    const shouldRunInBackground = this.params.is_background ?? false;

    // Prepare command for background execution
    let commandToExecute = this.params.command.trim();
    if (shouldRunInBackground && !commandToExecute.endsWith('&')) {
      commandToExecute = commandToExecute + ' &';
    }

    // Merge terminal configuration
    const baseConfig = this.config.getShellExecutionConfig();
    const terminalConfig: ShellExecutionConfig = {
      terminalWidth:
        this.params.terminal?.width ??
        shellExecutionConfig?.terminalWidth ??
        baseConfig.terminalWidth,
      terminalHeight:
        this.params.terminal?.height ??
        shellExecutionConfig?.terminalHeight ??
        baseConfig.terminalHeight,
      showColor:
        this.params.terminal?.showColor ??
        shellExecutionConfig?.showColor ??
        baseConfig.showColor,
      pager: shellExecutionConfig?.pager ?? baseConfig.pager,
    };

    let cumulativeOutput: string | AnsiOutput = '';
    let lastUpdateTime = Date.now();
    let isBinaryStream = false;

    const { result: resultPromise, pid } = await ShellExecutionService.execute(
      commandToExecute,
      cwd,
      (event: ShellOutputEvent) => {
        let shouldUpdate = false;

        switch (event.type) {
          case 'data':
            if (isBinaryStream) break;
            cumulativeOutput = event.chunk;
            shouldUpdate = true;
            break;
          case 'binary_detected':
            isBinaryStream = true;
            cumulativeOutput = '[Binary output detected. Halting stream...]';
            shouldUpdate = true;
            break;
          case 'binary_progress':
            isBinaryStream = true;
            cumulativeOutput = `[Receiving binary output... ${formatMemoryUsage(
              event.bytesReceived,
            )} received]`;
            if (Date.now() - lastUpdateTime > BASH_OUTPUT_UPDATE_INTERVAL_MS) {
              shouldUpdate = true;
            }
            break;
          default:
            throw new Error('Unhandled ShellOutputEvent type');
        }

        if (shouldUpdate && updateOutput) {
          updateOutput(
            typeof cumulativeOutput === 'string'
              ? cumulativeOutput
              : { ansiOutput: cumulativeOutput },
          );
          lastUpdateTime = Date.now();
        }
      },
      signal,
      this.config.getShouldUseNodePtyShell(),
      terminalConfig,
    );

    // Handle background execution
    if (shouldRunInBackground) {
      const pidMsg = pid ? ` PID: ${pid}` : '';
      const killHint = ' (Use kill <pid> to stop)';
      return {
        llmContent: `Background command started.${pidMsg}${killHint}`,
        returnDisplay: `Background command started.${pidMsg}${killHint}`,
      };
    }

    // Wait for foreground execution
    const result = await resultPromise;

    // Build result
    let llmContent = '';
    if (result.aborted) {
      llmContent = 'Command was cancelled by user.';
      if (result.output.trim()) {
        llmContent += ` Output before cancellation:\n${result.output}`;
      }
    } else {
      llmContent = [
        `Command: ${this.params.command}`,
        `Directory: ${cwd}`,
        `Output: ${result.output || '(empty)'}`,
        `Exit Code: ${result.exitCode ?? '(none)'}`,
        `Signal: ${result.signal ?? '(none)'}`,
      ].join('\n');
    }

    let returnDisplay = '';
    if (result.output.trim()) {
      returnDisplay = result.output;
    } else if (result.aborted) {
      returnDisplay = 'Command cancelled';
    } else if (result.signal) {
      returnDisplay = `Terminated by signal: ${result.signal}`;
    } else if (result.error) {
      returnDisplay = `Error: ${getErrorMessage(result.error)}`;
    } else if (result.exitCode !== null && result.exitCode !== 0) {
      returnDisplay = `Exited with code: ${result.exitCode}`;
    }

    const executionError = result.error
      ? {
          error: {
            message: result.error.message,
            type: ToolErrorType.SHELL_EXECUTE_ERROR,
          },
        }
      : {};

    return {
      llmContent,
      returnDisplay,
      ...executionError,
    };
  }
}

function getBashToolDescription(): string {
  return `Executes bash commands directly without permission checks or security restrictions.

**Use this tool when you need:**
- Direct, unrestricted command execution
- Pipeline operations (|, >, <, etc.)
- Complex bash features (process substitution, command chaining)
- Quick iteration without approval overhead

**Usage notes:**
- Commands execute as \`bash -c <command>\`
- No permission prompts or allowlists
- Full bash syntax supported
- Use \`is_background: true\` for long-running processes
- Prefer absolute paths in \`cwd\` parameter

**Examples:**
- \`grep -r "pattern" . | wc -l\`
- \`docker ps -a | grep my-container\`
- \`find . -name "*.ts" -exec wc -l {} +\`

**When to use run_shell_command (ShellTool) instead:**
- When you need permission tracking and allowlists
- For git commits that need co-author attribution
- In untrusted or production environments
- When security audit trails are required`;
}

export class BashTool extends BaseDeclarativeTool<BashToolParams, ToolResult> {
  static Name: string = ToolNames.BASH;

  constructor(private readonly config: Config) {
    super(
      BashTool.Name,
      ToolDisplayNames.BASH,
      getBashToolDescription(),
      Kind.Execute,
      {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Bash command to execute directly',
          },
          cwd: {
            type: 'string',
            description:
              'Working directory (absolute path). Defaults to project root.',
          },
          env: {
            type: 'object',
            description: 'Additional environment variables',
            additionalProperties: { type: 'string' },
          },
          is_background: {
            type: 'boolean',
            description:
              'Run in background. Default: false. Set to true for long-running processes.',
          },
          description: {
            type: 'string',
            description: 'Brief description of command purpose',
          },
          terminal: {
            type: 'object',
            description: 'Terminal configuration overrides',
            properties: {
              width: {
                type: 'number',
                description: 'Terminal width in columns',
              },
              height: {
                type: 'number',
                description: 'Terminal height in rows',
              },
              showColor: {
                type: 'boolean',
                description: 'Enable colored output',
              },
            },
          },
        },
        required: ['command'],
      } as Record<string, unknown>,
      false, // not markdown
      true, // can update output
    );
  }

  protected override validateToolParamValues(
    params: BashToolParams,
  ): string | null {
    // Minimal validation - just ensure command is not empty
    if (!params.command.trim()) {
      return 'Command cannot be empty';
    }

    // Validate cwd if provided
    if (params.cwd) {
      if (!path.isAbsolute(params.cwd)) {
        return 'Working directory must be an absolute path';
      }

      // Check if directory exists
      try {
        const stats = fs.statSync(params.cwd);
        if (!stats.isDirectory()) {
          return `Path exists but is not a directory: ${params.cwd}`;
        }
      } catch (err) {
        return `Directory does not exist: ${params.cwd}`;
      }

      // Check if within workspace
      const workspaceDirs = this.config.getWorkspaceContext().getDirectories();
      const isWithinWorkspace = workspaceDirs.some((wsDir) =>
        params.cwd!.startsWith(wsDir),
      );

      if (!isWithinWorkspace) {
        return `Directory is not within workspace: ${params.cwd}`;
      }
    }

    return null;
  }

  protected createInvocation(
    params: BashToolParams,
  ): ToolInvocation<BashToolParams, ToolResult> {
    return new BashToolInvocation(this.config, params);
  }
}
