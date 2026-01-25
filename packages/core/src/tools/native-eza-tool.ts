/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native Eza Tool
 * Modern replacement for 'ls' with native eza command and direct-to-disk output handling
 */

// import path from 'node:path';
import type { Config } from '../config/config.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import { ToolErrorType } from './tool-error.js';
import type { ToolInvocation, ToolResult, ToolResultDisplay } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { resolveAndValidatePath } from '../utils/paths.js';
import {
  NativeEzaExecutor,
  type EzaListOptions,
} from './native-eza-executor.js';

const MAX_INLINE_RESULTS = 100;
const PREVIEW_LINES = 50;

export interface NativeEzaToolParams {
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

export class NativeEzaToolInvocation extends BaseToolInvocation<
  NativeEzaToolParams,
  ToolResult
> {
  private readonly config: Config;

  constructor(config: Config, params: NativeEzaToolParams) {
    super(params);
    this.config = config;
  }

  getDescription(): string {
    const path = this.params.path || '.';
    let description = `Native Eza listing for ${path}`;

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

  async execute(
    signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    try {
      // Resolve the path
      let targetPath = this.params.path || '.';
      try {
        targetPath = resolveAndValidatePath(this.config, targetPath);
      } catch (error) {
        return {
          llmContent: `Invalid path: ${(error as Error).message} use shell eza/ls or bash eza/ls`,
          returnDisplay: `Invalid path: ${(error as Error).message} use shell eza/ls or bash eza/ls`,
          error: {
            message: (error as Error).message,
            type: ToolErrorType.EZA_EXECUTION_ERROR,
          },
        };
      }

      const executor = new NativeEzaExecutor();

      // Prepare options for eza executor
      const ezaOptions: EzaListOptions = {
        tree: this.params.tree,
        all: this.params.all,
        long: this.params.long,
        git: this.params.git,
        dirsOnly: this.params.dirs_only,
        filesOnly: this.params.files_only,
        depth: this.params.depth,
        sort: this.params.sort,
        reverse: this.params.reverse,
        permissions: this.params.permissions,
        owner: this.params.owner,
        size: this.params.size,
        time: this.params.time,
        signal,
      };

      const result = await executor.executeEzaDirectToDisk(
        targetPath,
        ezaOptions,
      );

      // Handle result
      if (!result.success) {
        const errorContent = await this.readErrorFile(result.errorPath);
        return {
          llmContent: `Eza listing failed: ${errorContent}`,
          returnDisplay: `Error: ${errorContent}`,
          error: {
            message: `Eza listing failed with exit code ${result.exitCode}`,
            type: ToolErrorType.EZA_EXECUTION_ERROR,
          },
        };
      }

      // Success - format result based on item count
      const preview = await executor.getEzaPreview(
        result.outputPath,
        PREVIEW_LINES,
      );

      // Format file size for display
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
      };

      const outputSizeStr = formatBytes(result.outputSize);
      console.log(
        `[NativeEzaTool] Output file size: ${outputSizeStr} (${result.outputSize} bytes)`,
      );
      console.log(`[NativeEzaTool] Output path: ${result.outputPath}`);

      // Check if eza was available
      const ezaAvailable = await executor.isEzaAvailable();
      const commandUsed = ezaAvailable ? 'eza' : 'ls (fallback)';

      let llmContent = '';
      let returnDisplay = '';

      if (result.itemCount <= MAX_INLINE_RESULTS) {
        // Small result set - include full list
        llmContent = `Eza listing for ${result.searchPath} using ${commandUsed}:\n\n${preview}\n\n📊 Output: ${outputSizeStr} (${result.outputPath})`;
        returnDisplay = `Eza listing for ${result.searchPath} using ${commandUsed}:\n${preview}`;
      } else {
        // Large result set - show reference and preview
        llmContent = `Directory listing for ${result.searchPath} using ${commandUsed} found ${result.itemCount} items.\n\nFirst ${PREVIEW_LINES} items:\n${preview}\n\nFull results available at: ${result.outputPath}\n📊 Output file size: ${outputSizeStr}\nTo read all results, use the read_file tool with this path.`;
        returnDisplay = `Directory listing for ${result.searchPath} using ${commandUsed} found ${result.itemCount} items (too many to display).\n\nFirst ${PREVIEW_LINES} items:\n${preview}\n\nResults file: ${result.outputPath} (${outputSizeStr})`;
      }

      return {
        llmContent,
        returnDisplay,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        llmContent: `Eza listing error: ${message}`,
        returnDisplay: `Error: ${message}`,
        error: {
          message,
          type: ToolErrorType.EZA_EXECUTION_ERROR,
        },
      };
    }
  }

  private async readErrorFile(filePath: string): Promise<string> {
    try {
      const fs = await import('node:fs');
      const content = fs.readFileSync(filePath, 'utf8');
      return content.trim() || '(empty error message)';
    } catch {
      return '(unable to read error file)';
    }
  }
}

function getNativeEzaToolDescription(): string {
  return `Native eza (modern 'ls' replacement) with direct-to-disk output handling.

**Advantages over standard eza:**
- Handles large directory listings efficiently (no memory buffering)
- Suitable for exploring large codebases (10k+ files/directories)
- Results written directly to disk, LLM receives only summary
- Reduces context usage significantly for large listings

**Parameters:**
- \`path\`: Directory or file path to list. Defaults to current directory.
- \`tree\`: Enable tree view display showing directory structure recursively.
- \`all\`: Show all files including hidden ones (starting with dot).
- \`long\`: Show long format with detailed information (permissions, size, time).
- \`git\`: Show Git status information for files in a Git repository.
- \`dirs_only\`: Show only directories, not files.
- \`files_only\`: Show only files, not directories.
- \`depth\`: Limit depth of recursion in tree mode. Ignored if tree is false.
- \`sort\`: Sort order (name, size, time, type). Default is name.
- \`reverse\`: Reverse sort order.
- \`permissions\`: Show permissions in long format. Implies long format.
- \`owner\`: Show owner and group in long format. Implies long format.
- \`size\`: Show file sizes in human-readable format. Implies long format.
- \`time\`: Show time information in long format. Implies long format.

**Results:**
- Small results (<100 items): Full list included in response
- Large results (>100 items): Preview shown, full results in file reference`;
}

export class NativeEzaTool extends BaseDeclarativeTool<
  NativeEzaToolParams,
  ToolResult
> {
  static readonly Name: string = ToolNames.NATIVE_EZA;

  constructor(private readonly config: Config) {
    super(
      NativeEzaTool.Name,
      ToolDisplayNames.NATIVE_EZA,
      getNativeEzaToolDescription(),
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
      } as Record<string, unknown>,
      false, // not markdown
      false, // cannot update output
    );
  }

  protected override validateToolParamValues(
    params: NativeEzaToolParams,
  ): string | null {
    // Validate path if provided
    if (params.path) {
      if (typeof params.path !== 'string') {
        return 'Path must be a string';
      }

      // try {
      //   resolveAndValidatePath(this.config, params.path);
      // } catch (error) {
      //   return `Invalid path: ${(error as Error).message}`;
      // }
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

    // Validate sort option
    if (
      params.sort &&
      !['name', 'size', 'time', 'type'].includes(params.sort)
    ) {
      return 'Sort must be one of: name, size, time, type';
    }

    return null;
  }

  protected createInvocation(
    params: NativeEzaToolParams,
  ): ToolInvocation<NativeEzaToolParams, ToolResult> {
    return new NativeEzaToolInvocation(this.config, params);
  }
}
