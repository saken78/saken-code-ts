/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import type { Config } from '../config/config.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import { ToolErrorType } from './tool-error.js';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { makeRelative, shortenPath } from '../utils/paths.js';
import { isSubpath } from '../utils/paths.js';
import { resolveAndValidatePath } from '../utils/paths.js';
import { getErrorMessage } from '../utils/errors.js';

/**
 * Parameters for the Bat tool
 */
export interface BatToolParams {
  /**
   * File(s) to print / concatenate. Use "-" for stdin.
   */
  file_paths: string[];

  /**
   * Show non-printable characters like space, tab or newline.
   */
  show_all?: boolean;

  /**
   * Set notation for non-printable characters: 'unicode' or 'caret'.
   */
  nonprintable_notation?: string;

  /**
   * How to treat binary content: 'no-printing' or 'as-text'.
   */
  binary?: string;

  /**
   * Only show plain style, no decorations.
   */
  plain?: boolean;

  /**
   * Explicitly set the language for syntax highlighting.
   */
  language?: string;

  /**
   * Highlight specific line ranges (e.g., "40", "30:40", ":40", "40:", "30:+10").
   */
  highlight_line?: string;

  /**
   * Specify the name to display for a file when piping from STDIN.
   */
  file_name?: string;

  /**
   * Only show lines that have been added/removed/modified with respect to Git index.
   */
  diff?: boolean;

  /**
   * Include N lines of context around Git changes.
   */
  diff_context?: number;

  /**
   * Set tab width to T spaces (use 0 to pass tabs through directly).
   */
  tabs?: number;

  /**
   * Text wrapping mode: 'auto', 'never', 'character'.
   */
  wrap?: string;

  /**
   * Truncate lines longer than screen width.
   */
  chop_long_lines?: boolean;

  /**
   * Explicitly set terminal width.
   */
  terminal_width?: number;

  /**
   * Only show line numbers, no other decorations.
   */
  number?: boolean;

  /**
   * When to use colored output: 'auto', 'never', 'always'.
   */
  color?: string;

  /**
   * When to use italic text: 'always', 'never'.
   */
  italic_text?: string;

  /**
   * When to use decorations: 'auto', 'never', 'always'.
   */
  decorations?: string;

  /**
   * Force colorization even when piping.
   */
  force_colorization?: boolean;

  /**
   * When to use pager: 'auto', 'never', 'always'.
   */
  paging?: string;

  /**
   * Specify which pager to use.
   */
  pager?: string;

  /**
   * Map glob patterns to syntax names (e.g., '*.build:Python').
   */
  map_syntax?: string;

  /**
   * Ignore file suffixes (e.g., '.dev' for 'file.json.dev').
   */
  ignored_suffix?: string;

  /**
   * Set theme for syntax highlighting.
   */
  theme?: string;

  /**
   * Theme for light backgrounds.
   */
  theme_light?: string;

  /**
   * Theme for dark backgrounds.
   */
  theme_dark?: string;

  /**
   * Display list of available themes.
   */
  list_themes?: boolean;

  /**
   * Squeeze consecutive empty lines.
   */
  squeeze_blank?: boolean;

  /**
   * Maximum consecutive empty lines to print.
   */
  squeeze_limit?: number;

  /**
   * When to strip ANSI sequences: 'auto', 'always', 'never'.
   */
  strip_ansi?: string;

  /**
   * Components to display: 'full', 'plain', 'numbers', 'changes', 'grid', etc.
   */
  style?: string;

  /**
   * Range of lines to display (e.g., "30:40", ":40", "40:", "-10:").
   */
  line_range?: string;

  /**
   * Display list of supported languages.
   */
  list_languages?: boolean;

  /**
   * Set terminal title to filenames when using pager.
   */
  set_terminal_title?: boolean;
}

class BatToolInvocation extends BaseToolInvocation<BatToolParams, ToolResult> {
  constructor(
    private readonly config: Config,
    params: BatToolParams,
  ) {
    super(params);
  }

  /**
   * Gets a description of the bat operation
   * @returns A string describing the bat command
   */
  getDescription(): string {
    const fileDescriptions = this.params.file_paths
      .map((filePath) => {
        if (path.isAbsolute(filePath)) {
          const relativePath = makeRelative(
            filePath,
            this.config.getTargetDir(),
          );
          return shortenPath(relativePath);
        }
        return filePath;
      })
      .join(', ');

    let description = `bat ${fileDescriptions}`;

    if (this.params.theme) {
      description += ` (theme: ${this.params.theme})`;
    }

    if (this.params.language) {
      description += ` (language: ${this.params.language})`;
    }

    if (this.params.number) {
      description += ` [with line numbers]`;
    }

    if (this.params.diff) {
      description += ` [showing git changes]`;
    }

    return description;
  }

  /**
   * Executes the Bat operation with the given parameters
   * @returns Result of the Bat operation
   */
  async execute(_signal: AbortSignal): Promise<ToolResult> {
    // Check if bat is installed
    const batAvailable = await this.isCommandAvailable('bat');
    if (!batAvailable) {
      return {
        llmContent:
          'Error: bat command is not available. Please install bat (https://github.com/sharkdp/bat) to use this tool.',
        returnDisplay:
          'Error: bat command is not available. Please install bat to use this tool.',
        error: {
          message: 'bat command is not available',
          type: ToolErrorType.BAT_EXECUTION_ERROR,
        },
      };
    }

    try {
      // Validate file paths
      for (const filePath of this.params.file_paths) {
        if (filePath !== '-') {
          // '-' means stdin
          resolveAndValidatePath(this.config, filePath);

          // Check if file exists
          try {
            await fs.promises.access(filePath, fs.constants.R_OK);
          } catch (error) {
            return {
              llmContent: `Error: Cannot read file ${filePath}. ${getErrorMessage(error)}`,
              returnDisplay: `Error: Cannot read file ${filePath}`,
              error: {
                message: `Cannot read file ${filePath}: ${getErrorMessage(error)}`,
                type: ToolErrorType.FILE_NOT_FOUND,
              },
            };
          }
        }
      }

      // Build bat command arguments
      const args = this.buildBatArgs();

      const result = await new Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
      }>((resolve, reject) => {
        const child = spawn('bat', args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: this.config.getTargetDir(),
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('error', (error) => {
          reject(error);
        });

        child.on('close', (code) => {
          resolve({ stdout, stderr, exitCode: code || 0 });
        });

        // If any file path is '-', pipe stdin to the process
        if (this.params.file_paths.includes('-')) {
          // In this case, we would normally pipe stdin, but since we're simulating
          // stdin with file paths, we'll handle it differently
          child.stdin.end();
        }
      });

      if (result.exitCode !== 0) {
        return {
          llmContent: `Error executing bat command: ${result.stderr || `Exit code: ${result.exitCode}`}`,
          returnDisplay: `Error executing bat: ${result.stderr || `Exit code: ${result.exitCode}`}`,
          error: {
            message: result.stderr || `Exit code: ${result.exitCode}`,
            type: ToolErrorType.BAT_EXECUTION_ERROR,
          },
        };
      }

      return {
        llmContent: result.stdout,
        returnDisplay: `Successfully displayed ${this.params.file_paths.length} file(s) with bat`,
      };
    } catch (error) {
      const errorMsg = `Error executing bat command: ${getErrorMessage(error)}`;
      return {
        llmContent: errorMsg,
        returnDisplay: `Error executing bat command`,
        error: {
          message: getErrorMessage(error),
          type: ToolErrorType.BAT_EXECUTION_ERROR,
        },
      };
    }
  }

  private async isCommandAvailable(command: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('which', [command]);
      child.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }

  private buildBatArgs(): string[] {
    const args: string[] = [];

    // Add flags based on parameters
    if (this.params.show_all) args.push('--show-all');
    if (this.params.plain) args.push('--plain');
    if (this.params.number) args.push('--number');
    if (this.params.diff) args.push('--diff');
    if (this.params.chop_long_lines) args.push('--chop-long-lines');
    if (this.params.force_colorization) args.push('--force-colorization');
    if (this.params.squeeze_blank) args.push('--squeeze-blank');

    // Add options with values
    if (this.params.language) {
      args.push('--language', this.params.language);
    }
    if (this.params.highlight_line) {
      args.push('--highlight-line', this.params.highlight_line);
    }
    if (this.params.file_name) {
      args.push('--file-name', this.params.file_name);
    }
    if (this.params.diff_context !== undefined) {
      args.push('--diff-context', this.params.diff_context.toString());
    }
    if (this.params.tabs !== undefined) {
      args.push('--tabs', this.params.tabs.toString());
    }
    if (this.params.terminal_width !== undefined) {
      args.push('--terminal-width', this.params.terminal_width.toString());
    }
    if (this.params.color) {
      args.push('--color', this.params.color);
    }
    if (this.params.italic_text) {
      args.push('--italic-text', this.params.italic_text);
    }
    if (this.params.decorations) {
      args.push('--decorations', this.params.decorations);
    }
    if (this.params.paging) {
      args.push('--paging', this.params.paging);
    }
    if (this.params.pager) {
      args.push('--pager', this.params.pager);
    }
    if (this.params.map_syntax) {
      args.push('--map-syntax', this.params.map_syntax);
    }
    if (this.params.ignored_suffix) {
      args.push('--ignored-suffix', this.params.ignored_suffix);
    }
    if (this.params.theme) {
      args.push('--theme', this.params.theme);
    }
    if (this.params.theme_light) {
      args.push('--theme-light', this.params.theme_light);
    }
    if (this.params.theme_dark) {
      args.push('--theme-dark', this.params.theme_dark);
    }
    if (this.params.squeeze_limit !== undefined) {
      args.push('--squeeze-limit', this.params.squeeze_limit.toString());
    }
    if (this.params.strip_ansi) {
      args.push('--strip-ansi', this.params.strip_ansi);
    }
    if (this.params.style) {
      args.push('--style', this.params.style);
    }
    if (this.params.line_range) {
      args.push('--line-range', this.params.line_range);
    }
    if (this.params.nonprintable_notation) {
      args.push('--nonprintable-notation', this.params.nonprintable_notation);
    }
    if (this.params.binary) {
      args.push('--binary', this.params.binary);
    }
    if (this.params.wrap) {
      args.push('--wrap', this.params.wrap);
    }

    // Add special flags for listing
    if (this.params.list_themes) args.push('--list-themes');
    if (this.params.list_languages) args.push('--list-languages');

    // Add file paths at the end
    args.push(...this.params.file_paths);

    return args;
  }
}

/**
 * Implementation of the Bat tool logic
 */
export class BatTool extends BaseDeclarativeTool<BatToolParams, ToolResult> {
  static readonly Name = ToolNames.BAT;

  constructor(private config: Config) {
    super(
      BatTool.Name,
      ToolDisplayNames.BAT,
      'A cat(1) clone with syntax highlighting and Git integration. Displays file contents with various formatting options including syntax highlighting, line numbers, Git differences, and more.',
      Kind.Read,
      {
        properties: {
          file_paths: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'File(s) to print / concatenate. Use "-" for stdin.',
          },
          show_all: {
            type: 'boolean',
            description:
              'Show non-printable characters like space, tab or newline.',
          },
          nonprintable_notation: {
            type: 'string',
            description:
              "Set notation for non-printable characters: 'unicode' or 'caret'.",
          },
          binary: {
            type: 'string',
            description:
              "How to treat binary content: 'no-printing' or 'as-text'.",
          },
          plain: {
            type: 'boolean',
            description: 'Only show plain style, no decorations.',
          },
          language: {
            type: 'string',
            description: 'Explicitly set the language for syntax highlighting.',
          },
          highlight_line: {
            type: 'string',
            description:
              'Highlight specific line ranges (e.g., "40", "30:40", ":40", "40:", "30:+10").',
          },
          file_name: {
            type: 'string',
            description:
              'Specify the name to display for a file when piping from STDIN.',
          },
          diff: {
            type: 'boolean',
            description:
              'Only show lines that have been added/removed/modified with respect to Git index.',
          },
          diff_context: {
            type: 'number',
            description: 'Include N lines of context around Git changes.',
          },
          tabs: {
            type: 'number',
            description:
              'Set tab width to T spaces (use 0 to pass tabs through directly).',
          },
          wrap: {
            type: 'string',
            description: "Text wrapping mode: 'auto', 'never', 'character'.",
          },
          chop_long_lines: {
            type: 'boolean',
            description: 'Truncate lines longer than screen width.',
          },
          terminal_width: {
            type: 'number',
            description: 'Explicitly set terminal width.',
          },
          number: {
            type: 'boolean',
            description: 'Only show line numbers, no other decorations.',
          },
          color: {
            type: 'string',
            description:
              "When to use colored output: 'auto', 'never', 'always'.",
          },
          italic_text: {
            type: 'string',
            description: "When to use italic text: 'always', 'never'.",
          },
          decorations: {
            type: 'string',
            description: "When to use decorations: 'auto', 'never', 'always'.",
          },
          force_colorization: {
            type: 'boolean',
            description: 'Force colorization even when piping.',
          },
          paging: {
            type: 'string',
            description: "When to use pager: 'auto', 'never', 'always'.",
          },
          pager: {
            type: 'string',
            description: 'Specify which pager to use.',
          },
          map_syntax: {
            type: 'string',
            description:
              "Map glob patterns to syntax names (e.g., '*.build:Python').",
          },
          ignored_suffix: {
            type: 'string',
            description:
              "Ignore file suffixes (e.g., '.dev' for 'file.json.dev').",
          },
          theme: {
            type: 'string',
            description: 'Set theme for syntax highlighting.',
          },
          theme_light: {
            type: 'string',
            description: 'Theme for light backgrounds.',
          },
          theme_dark: {
            type: 'string',
            description: 'Theme for dark backgrounds.',
          },
          list_themes: {
            type: 'boolean',
            description: 'Display list of available themes.',
          },
          squeeze_blank: {
            type: 'boolean',
            description: 'Squeeze consecutive empty lines.',
          },
          squeeze_limit: {
            type: 'number',
            description: 'Maximum consecutive empty lines to print.',
          },
          strip_ansi: {
            type: 'string',
            description:
              "When to strip ANSI sequences: 'auto', 'always', 'never'.",
          },
          style: {
            type: 'string',
            description:
              "Components to display: 'full', 'plain', 'numbers', 'changes', 'grid', etc.",
          },
          line_range: {
            type: 'string',
            description:
              'Range of lines to display (e.g., "30:40", ":40", "40:", "-10:").',
          },
          list_languages: {
            type: 'boolean',
            description: 'Display list of supported languages.',
          },
          set_terminal_title: {
            type: 'boolean',
            description: 'Set terminal title to filenames when using pager.',
          },
        },
        required: ['file_paths'],
        type: 'object',
      },
    );
  }

  /**
   * Validates the parameters for the tool
   * @param params Parameters to validate
   * @returns An error message string if invalid, null otherwise
   */
  protected override validateToolParamValues(
    params: BatToolParams,
  ): string | null {
    if (!Array.isArray(params.file_paths) || params.file_paths.length === 0) {
      return "The 'file_paths' parameter must be a non-empty array of file paths.";
    }

    for (const filePath of params.file_paths) {
      if (filePath !== '-') {
        // '-' means stdin, which doesn't need validation
        if (!path.isAbsolute(filePath)) {
          return `File path must be absolute: ${filePath}. You must provide an absolute path.`;
        }

        const workspaceContext = this.config.getWorkspaceContext();
        const projectTempDir = this.config.storage.getProjectTempDir();
        const userSkillsDir = this.config.storage.getUserSkillsDir();
        const resolvedFilePath = path.resolve(filePath);
        const isWithinTempDir = isSubpath(projectTempDir, resolvedFilePath);
        const isWithinUserSkills = isSubpath(userSkillsDir, resolvedFilePath);

        if (
          !workspaceContext.isPathWithinWorkspace(filePath) &&
          !isWithinTempDir &&
          !isWithinUserSkills
        ) {
          const directories = workspaceContext.getDirectories();
          return `File path must be within one of the workspace directories: ${directories.join(
            ', ',
          )} or within the project temp directory: ${projectTempDir}`;
        }

        // Check if file should be ignored by .qwenignore
        const fileService = this.config.getFileService();
        if (fileService.shouldQwenIgnoreFile(filePath)) {
          return `File path '${filePath}' is ignored by .qwenignore pattern(s).`;
        }
      }
    }

    // Validate specific parameter combinations
    if (params.list_themes && params.list_languages) {
      return "Cannot use both 'list_themes' and 'list_languages' simultaneously.";
    }

    // Validate color parameter
    if (params.color && !['auto', 'never', 'always'].includes(params.color)) {
      return `Invalid color value: ${params.color}. Valid values are: 'auto', 'never', 'always'.`;
    }

    // Validate decorations parameter
    if (
      params.decorations &&
      !['auto', 'never', 'always'].includes(params.decorations)
    ) {
      return `Invalid decorations value: ${params.decorations}. Valid values are: 'auto', 'never', 'always'.`;
    }

    // Validate paging parameter
    if (params.paging && !['auto', 'never', 'always'].includes(params.paging)) {
      return `Invalid paging value: ${params.paging}. Valid values are: 'auto', 'never', 'always'.`;
    }

    // Validate wrap parameter
    if (params.wrap && !['auto', 'never', 'character'].includes(params.wrap)) {
      return `Invalid wrap value: ${params.wrap}. Valid values are: 'auto', 'never', 'character'.`;
    }

    // Validate nonprintable_notation parameter
    if (
      params.nonprintable_notation &&
      !['unicode', 'caret'].includes(params.nonprintable_notation)
    ) {
      return `Invalid nonprintable_notation value: ${params.nonprintable_notation}. Valid values are: 'unicode', 'caret'.`;
    }

    // Validate binary parameter
    if (params.binary && !['no-printing', 'as-text'].includes(params.binary)) {
      return `Invalid binary value: ${params.binary}. Valid values are: 'no-printing', 'as-text'.`;
    }

    return null;
  }

  protected createInvocation(
    params: BatToolParams,
  ): ToolInvocation<BatToolParams, ToolResult> {
    return new BatToolInvocation(this.config, params);
  }
}
