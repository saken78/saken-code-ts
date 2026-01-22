/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * FD Native Tool
 * Native FD executor integrated as a tool with context-aware result handling
 */

import path from 'node:path';
import type { Config } from '../config/config.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import { ToolErrorType } from './tool-error.js';
import type { ToolInvocation, ToolResult, ToolResultDisplay } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import {
  NativeFdExecutor,
  type FdSearchOptions,
} from './native-fd-executor.js';

const MAX_INLINE_RESULTS = 100;
const PREVIEW_LINES = 50;

export interface FdNativeToolParams {
  pattern: string;
  searchPath?: string;
  fileType?: 'f' | 'd' | null;
  maxDepth?: number | null;
  caseSensitive?: boolean;
  followSymlinks?: boolean;
  extensions?: string[];
  excludeDirs?: string[];
  minSize?: string | null;
  maxSize?: string | null;
  modifiedDays?: number | null;
  useSmartSearch?: boolean;
}

export class FdNativeToolInvocation extends BaseToolInvocation<
  FdNativeToolParams,
  ToolResult
> {
  constructor(_config: Config, params: FdNativeToolParams) {
    super(params);
  }

  getDescription(): string {
    let description = `Search files: "${this.params.pattern}"`;

    if (this.params.searchPath && this.params.searchPath !== '.') {
      description += ` in ${this.params.searchPath}`;
    }

    if (this.params.fileType) {
      const typeLabel = this.params.fileType === 'f' ? 'files' : 'directories';
      description += ` (${typeLabel} only)`;
    }

    if (this.params.extensions?.length) {
      description += ` [${this.params.extensions.join(', ')}]`;
    }

    return description;
  }

  async execute(
    signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    try {
      const searchPath = this.params.searchPath || '.';
      const executor = new NativeFdExecutor();

      let result;

      // Use smart search if filters are provided
      if (
        this.params.useSmartSearch ||
        this.params.extensions ||
        this.params.excludeDirs ||
        this.params.minSize ||
        this.params.maxSize ||
        this.params.modifiedDays
      ) {
        result = await executor.smartFdSearch(
          this.params.pattern,
          searchPath,
          {
            extensions: this.params.extensions,
            excludeDirs: this.params.excludeDirs,
            minSize: this.params.minSize,
            maxSize: this.params.maxSize,
            modifiedDays: this.params.modifiedDays,
          },
          { signal },
        );
      } else {
        // Standard fd search
        const fdOptions: FdSearchOptions = {
          fileType: this.params.fileType ?? null,
          maxDepth: this.params.maxDepth ?? null,
          caseSensitive: this.params.caseSensitive ?? false,
          followSymlinks: this.params.followSymlinks ?? false,
          signal,
        };

        result = await executor.executeFdDirectToDisk(
          this.params.pattern,
          searchPath,
          fdOptions,
        );
      }

      // Handle result
      if (!result.success) {
        const errorContent = await this.readErrorFile(result.errorPath);
        return {
          llmContent: `fd search failed: ${errorContent}`,
          returnDisplay: `Error: ${errorContent}`,
          error: {
            message: `fd search failed with exit code ${result.exitCode}`,
            type: ToolErrorType.FD_EXECUTION_ERROR,
          },
        };
      }

      // Success - format result based on file count
      const preview = await executor.getFdPreview(
        result.outputPath,
        PREVIEW_LINES,
      );

      // Format file size for display
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
      };

      const outputSizeStr = formatBytes(result.outputSize);
      console.log(
        `[FdNativeTool] Output file size: ${outputSizeStr} (${result.outputSize} bytes)`,
      );
      console.log(`[FdNativeTool] Output path: ${result.outputPath}`);

      let llmContent = '';
      let returnDisplay = '';

      if (result.fileCount <= MAX_INLINE_RESULTS) {
        // Small result set - include full list
        llmContent = `Found ${result.fileCount} match(es) for pattern "${this.params.pattern}" in ${result.searchPath}:\n\n${preview}\n\n📊 Output: ${outputSizeStr} (${result.outputPath})`;
        returnDisplay = `Found ${result.fileCount} matches:\n${preview}`;
      } else {
        // Large result set - show reference and preview
        llmContent = `Found ${result.fileCount} matches for pattern "${this.params.pattern}" in ${result.searchPath}.\n\nFirst ${PREVIEW_LINES} results:\n${preview}\n\nFull results available at: ${result.outputPath}\n📊 Output file size: ${outputSizeStr}\nTo read all results, use the read_file tool with this path.`;
        returnDisplay = `Found ${result.fileCount} matches (too many to display).\n\nFirst ${PREVIEW_LINES} results:\n${preview}\n\nResults file: ${result.outputPath} (${outputSizeStr})`;
      }

      return {
        llmContent,
        returnDisplay,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        llmContent: `fd search error: ${message}`,
        returnDisplay: `Error: ${message}`,
        error: {
          message,
          type: ToolErrorType.FD_EXECUTION_ERROR,
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

function getFdNativeToolDescription(): string {
  return `Native file search using fd command with direct-to-disk output handling.

**Advantages over standard fd:**
- Handles large result sets efficiently (no memory buffering)
- Suitable for searching directories with 100k+ files
- Results written directly to disk, LLM receives only summary
- Reduces context usage significantly for large searches

**Parameters:**
- \`pattern\`: Regex pattern to search for (required)
- \`searchPath\`: Directory to search in (default: current directory)
- \`fileType\`: Filter by type 'f' (files) or 'd' (directories)
- \`maxDepth\`: Limit search depth
- \`caseSensitive\`: Case-sensitive matching (default: false)
- \`followSymlinks\`: Follow symbolic links (default: false)
- \`extensions\`: Filter by file extensions (for smart search)
- \`excludeDirs\`: Directories to exclude (for smart search)
- \`minSize\`/\`maxSize\`: File size filters (for smart search)
- \`modifiedDays\`: Recently modified files filter (for smart search)
- \`useSmartSearch\`: Enable smart search mode with filters

**Results:**
- Small results (<100 matches): Full list included in response
- Large results (>100 matches): Preview shown, full results in file reference`;
}

export class FdNativeTool extends BaseDeclarativeTool<
  FdNativeToolParams,
  ToolResult
> {
  static Name: string = ToolNames.NATIVE_FD;

  constructor(private readonly config: Config) {
    super(
      FdNativeTool.Name,
      ToolDisplayNames.FD,
      getFdNativeToolDescription(),
      Kind.Search,
      {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'Regex pattern to search for files/directories',
          },
          searchPath: {
            type: 'string',
            description: 'Directory to search in (default: current directory)',
          },
          fileType: {
            type: 'string',
            enum: ['f', 'd'],
            description: 'Filter by file type: f (files) or d (directories)',
          },
          maxDepth: {
            type: 'number',
            description: 'Maximum search depth',
          },
          caseSensitive: {
            type: 'boolean',
            description: 'Case-sensitive matching (default: false)',
          },
          followSymlinks: {
            type: 'boolean',
            description: 'Follow symbolic links (default: false)',
          },
          extensions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by file extensions',
          },
          excludeDirs: {
            type: 'array',
            items: { type: 'string' },
            description: 'Directories to exclude',
          },
          minSize: {
            type: 'string',
            description: 'Minimum file size (e.g., "1k", "1m")',
          },
          maxSize: {
            type: 'string',
            description: 'Maximum file size (e.g., "1k", "1m")',
          },
          modifiedDays: {
            type: 'number',
            description: 'Files modified within last N days',
          },
          useSmartSearch: {
            type: 'boolean',
            description: 'Enable smart search with advanced filtering options',
          },
        },
        required: ['pattern'],
      } as Record<string, unknown>,
      false, // not markdown
      false, // cannot update output
    );
  }

  protected override validateToolParamValues(
    params: FdNativeToolParams,
  ): string | null {
    // Validate pattern
    if (!params.pattern || !params.pattern.trim()) {
      return 'Pattern cannot be empty';
    }

    // Validate searchPath if provided
    if (params.searchPath) {
      if (!path.isAbsolute(params.searchPath)) {
        // Allow relative paths for fd
        params.searchPath = path.resolve(params.searchPath);
      }
    }

    // Validate maxDepth
    if (params.maxDepth !== null && params.maxDepth !== undefined) {
      if (params.maxDepth < 0) {
        return 'maxDepth must be a positive number';
      }
    }

    // Validate file type
    if (params.fileType && !['f', 'd'].includes(params.fileType)) {
      return 'fileType must be "f" (files) or "d" (directories)';
    }

    return null;
  }

  protected createInvocation(
    params: FdNativeToolParams,
  ): ToolInvocation<FdNativeToolParams, ToolResult> {
    return new FdNativeToolInvocation(this.config, params);
  }
}
