/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import { ToolErrorType } from './tool-error.js';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { resolveAndValidatePath } from '../utils/paths.js';
import { exec } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface EzaToolParams {
  /**
   * The directory or file path to list. Defaults to current directory.
   */
  path?: string;

  /**
   * Enable tree view display
   */
  tree?: boolean;

  /**
   * Show all files including hidden ones
   */
  all?: boolean;

  /**
   * Show long format with detailed information
   */
  long?: boolean;

  /**
   * Show Git status information
   */
  git?: boolean;

  /**
   * Show only directories
   */
  dirs_only?: boolean;

  /**
   * Show only files
   */
  files_only?: boolean;

  /**
   * Limit depth of recursion in tree mode
   */
  depth?: number;

  /**
   * Sort order (name, size, time, type)
   */
  sort?: 'name' | 'size' | 'time' | 'type';

  /**
   * Reverse sort order
   */
  reverse?: boolean;

  /**
   * Show permissions
   */
  permissions?: boolean;

  /**
   * Show owner/group
   */
  owner?: boolean;

  /**
   * Show size in human readable format
   */
  size?: boolean;

  /**
   * Show time information
   */
  time?: boolean;
}

class EzaToolInvocation extends BaseToolInvocation<EzaToolParams, ToolResult> {
  constructor(
    private readonly config: Config,
    params: EzaToolParams,
  ) {
    super(params);
  }

  getDescription(): string {
    const path = this.params.path || '.';
    let description = `Eza listing for ${path}`;

    const flags = [];
    if (this.params.tree) flags.push('--tree');
    if (this.params.all) flags.push('--all');
    if (this.params.long) flags.push('--long');
    if (this.params.git) flags.push('--git');
    if (this.params.dirs_only) flags.push('--dirs-only');
    if (this.params.files_only) flags.push('--files-only');
    if (this.params.depth !== undefined)
      flags.push(`--depth=${this.params.depth}`);
    if (this.params.sort) flags.push(`--sort=${this.params.sort}`);
    if (this.params.reverse) flags.push('--reverse');
    if (this.params.permissions) flags.push('--permissions');
    if (this.params.owner) flags.push('--owner');
    if (this.params.size) flags.push('--size');
    if (this.params.time) flags.push('--time');

    if (flags.length > 0) {
      description += ` with flags: ${flags.join(', ')}`;
    }

    return description;
  }

  async execute(signal: AbortSignal): Promise<ToolResult> {
    // Check if eza is installed
    const ezaExists = true;
    let fallbackToLs = false;

    try {
      // const { stdout } =  exec('which eza', { signal });
      // ezaExists = stdout.trim().length > 0;
    } catch (_error) {
      // eza not found, check if ls is available as fallback
      try {
        exec('which ls', { signal });
        fallbackToLs = true;
      } catch (_lsError) {
        return {
          llmContent:
            'Error: Neither eza nor ls command found in system. Please install eza or ensure ls is available.',
          returnDisplay:
            'Error: Neither eza nor ls command found in system. Please install eza or ensure ls is available.',
          error: {
            message: 'Neither eza nor ls command found',
            type: ToolErrorType.SHELL_EXECUTE_ERROR,
          },
        };
      }
    }

    // Resolve the path
    let targetPath = this.params.path || '.';
    try {
      targetPath = resolveAndValidatePath(this.config, targetPath);
    } catch (error) {
      return {
        llmContent: `Invalid path: ${(error as Error).message}`,
        returnDisplay: `Invalid path: ${(error as Error).message}`,
        error: {
          message: (error as Error).message,
          type: ToolErrorType.EZA_EXECUTION_ERROR,
        },
      };
    }

    // Build the command based on what's available
    let command = '';
    if (ezaExists && !fallbackToLs) {
      // Use eza with full feature support
      command = 'eza';

      if (this.params.tree) {
        command += ' --tree';
        if (this.params.depth !== undefined) {
          command += ` --depth=${this.params.depth}`;
        }
      }

      if (this.params.all) {
        command += ' -a';
      }

      if (this.params.long) {
        command += ' -l';
      }

      if (this.params.git) {
        command += ' --git';
      }

      if (this.params.dirs_only) {
        command += ' -d */';
      }

      if (this.params.files_only && !this.params.dirs_only) {
        command += ' --only-files';
      }

      if (this.params.sort) {
        command += ` --sort=${this.params.sort}`;
        if (this.params.reverse) {
          command += ' --reverse';
        }
      }

      if (this.params.permissions) {
        if (!this.params.long) command += ' -l'; // Need long format for permissions
      }

      if (this.params.owner) {
        if (!this.params.long) command += ' -l'; // Need long format for owner
      }

      if (this.params.size) {
        if (!this.params.long) command += ' -l'; // Need long format for size
      }

      if (this.params.time) {
        if (!this.params.long) command += ' -l'; // Need long format for time
      }
    } else {
      // Fallback to ls with basic feature support
      command = 'ls';

      if (this.params.all) {
        command += ' -a';
      }

      if (this.params.long) {
        command += ' -l';
      }

      if (this.params.dirs_only) {
        command += ' -d */';
      }

      if (this.params.sort) {
        switch (this.params.sort) {
          case 'time':
            command += ' -t';
            if (this.params.reverse) command += ' -r';
            break;
          case 'size':
            command += ' -S';
            if (this.params.reverse) command += ' -r';
            break;
          case 'name':
          case 'type':
          default:
            if (this.params.reverse) command += ' -r';
            break;
        }
      } else if (this.params.reverse) {
        command += ' -r';
      }

      // Tree functionality not available in basic ls, warn user
      if (this.params.tree) {
        command += ' -la'; // Basic listing as fallback
      }
    }

    command += ` "${targetPath}"`;

    try {
      // Execute the command with timeout
      const result = await Promise.race([
        execAsync(command, {
          cwd: this.config.getTargetDir(),
          signal,
        }),
        setTimeout(10000).then(() => {
          throw new Error('Command timed out after 10 seconds');
        }),
      ]);

      const output = result.stdout || result.stderr || '(no output)';

      // Add info about which command was actually used
      const commandUsed = ezaExists && !fallbackToLs ? 'eza' : 'ls';
      const commandInfo = commandUsed === 'eza' ? 'Eza' : 'LS (fallback)';

      return {
        llmContent: `${commandInfo} listing for ${targetPath}:\n${output}\n\n(Command used: ${command})`,
        returnDisplay: output,
      };
    } catch (error: unknown) {
      // Handle specific errors
      if (signal.aborted) {
        return {
          llmContent: 'Command was cancelled by user.',
          returnDisplay: 'Command was cancelled',
        };
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        llmContent: `Error executing ${ezaExists && !fallbackToLs ? 'eza' : 'ls'} command: ${errorMessage}\nCommand attempted: ${command}`,
        returnDisplay: `Error: ${errorMessage}`,
        error: {
          message: errorMessage,
          type: ToolErrorType.SHELL_EXECUTE_ERROR,
        },
      };
    }
  }
}

export class EzaTool extends BaseDeclarativeTool<EzaToolParams, ToolResult> {
  static readonly Name = ToolNames.EZA;

  constructor(private config: Config) {
    super(
      EzaTool.Name,
      ToolDisplayNames.EZA,
      "Modern replacement for 'ls' with features like tree view, metadata display, Git integration, etc. Provides enhanced file and directory listings with colorized output, tree views, and additional metadata.",
      Kind.Search,
      {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description:
              'The directory or file path to list. Defaults to current directory.',
          },
          tree: {
            type: 'boolean',
            description:
              'Enable tree view display showing directory structure recursively.',
          },
          all: {
            type: 'boolean',
            description:
              'Show all files including hidden ones (starting with dot).',
          },
          long: {
            type: 'boolean',
            description:
              'Show long format with detailed information (permissions, size, time).',
          },
          git: {
            type: 'boolean',
            description:
              'Show Git status information for files in a Git repository.',
          },
          dirs_only: {
            type: 'boolean',
            description: 'Show only directories, not files.',
          },
          files_only: {
            type: 'boolean',
            description: 'Show only files, not directories.',
          },
          depth: {
            type: 'number',
            description:
              'Limit depth of recursion in tree mode. Ignored if tree is false.',
          },
          sort: {
            type: 'string',
            enum: ['name', 'size', 'time', 'type'],
            description: 'Sort order for the listing. Default is name.',
          },
          reverse: {
            type: 'boolean',
            description: 'Reverse sort order.',
          },
          permissions: {
            type: 'boolean',
            description:
              'Show permissions in long format. Implies long format.',
          },
          owner: {
            type: 'boolean',
            description:
              'Show owner and group in long format. Implies long format.',
          },
          size: {
            type: 'boolean',
            description:
              'Show file sizes in human-readable format. Implies long format.',
          },
          time: {
            type: 'boolean',
            description:
              'Show time information in long format. Implies long format.',
          },
        },
        required: [],
      },
    );
  }

  protected override validateToolParamValues(
    params: EzaToolParams,
  ): string | null {
    // Validate path if provided
    if (params.path) {
      if (typeof params.path !== 'string') {
        return 'Path must be a string';
      }

      try {
        resolveAndValidatePath(this.config, params.path);
      } catch (error) {
        return `Invalid path: ${(error as Error).message}`;
      }
    }

    // Validate depth if provided
    if (params.depth !== undefined) {
      if (typeof params.depth !== 'number' || params.depth < 0) {
        return 'Depth must be a non-negative number';
      }
    }

    // Check incompatible options
    if (params.dirs_only && params.files_only) {
      return 'Cannot specify both dirs_only and files_only';
    }

    return null;
  }

  protected createInvocation(
    params: EzaToolParams,
  ): ToolInvocation<EzaToolParams, ToolResult> {
    return new EzaToolInvocation(this.config, params);
  }
}
