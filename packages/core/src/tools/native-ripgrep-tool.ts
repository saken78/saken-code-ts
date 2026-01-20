/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native Ripgrep Tool
 * Text search tool with native ripgrep and direct-to-disk output handling
 */

import path from 'node:path';
import type { Config } from '../config/config.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import { ToolErrorType } from './tool-error.js';
import type { ToolInvocation, ToolResult, ToolResultDisplay } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import {
  NativeRipgrepExecutor,
  type RipgrepSearchOptions,
} from './native-ripgrep-executor.js';

const MAX_INLINE_RESULTS = 100;
const PREVIEW_LINES = 50;

export interface NativeRipgrepToolParams {
  pattern: string;
  searchPath?: string;
  glob?: string | null;
  caseSensitive?: boolean;
  fileTypes?: string[];
  maxCount?: number | null;
  useSmartSearch?: boolean;
}

export class NativeRipgrepToolInvocation extends BaseToolInvocation<
  NativeRipgrepToolParams,
  ToolResult
> {
  constructor(_config: Config, params: NativeRipgrepToolParams) {
    super(params);
  }

  getDescription(): string {
    let description = `Search text: "${this.params.pattern}"`;

    if (this.params.searchPath && this.params.searchPath !== '.') {
      description += ` in ${this.params.searchPath}`;
    }

    if (this.params.glob) {
      description += ` [glob: ${this.params.glob}]`;
    }

    if (this.params.fileTypes?.length) {
      description += ` (types: ${this.params.fileTypes.join(', ')})`;
    }

    return description;
  }

  async execute(
    signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    try {
      const searchPath = this.params.searchPath || '.';
      const executor = new NativeRipgrepExecutor();

      let result;

      // Use smart search if filters are provided
      if (
        this.params.useSmartSearch ||
        this.params.fileTypes ||
        this.params.maxCount
      ) {
        result = await executor.smartRipgrepSearch(
          this.params.pattern,
          searchPath,
          {
            glob: this.params.glob ?? null,
            fileTypes: this.params.fileTypes,
            maxCount: this.params.maxCount,
            caseSensitive: this.params.caseSensitive ?? false,
          },
          { signal },
        );
      } else {
        // Standard ripgrep search
        const rgOptions: RipgrepSearchOptions = {
          glob: this.params.glob ?? null,
          caseSensitive: this.params.caseSensitive ?? false,
          fileTypes: this.params.fileTypes,
          maxCount: this.params.maxCount,
          signal,
        };

        result = await executor.executeRipgrepDirectToDisk(
          this.params.pattern,
          searchPath,
          rgOptions,
        );
      }

      // Handle result
      if (!result.success) {
        const errorContent = await this.readErrorFile(result.errorPath);
        return {
          llmContent: `ripgrep search failed: ${errorContent}`,
          returnDisplay: `Error: ${errorContent}`,
          error: {
            message: `ripgrep search failed with exit code ${result.exitCode}`,
            type: ToolErrorType.GREP_EXECUTION_ERROR,
          },
        };
      }

      // Success - format result based on match count
      const preview = await executor.getRipgrepPreview(
        result.outputPath,
        PREVIEW_LINES,
      );

      let llmContent = '';
      let returnDisplay = '';

      if (result.matchCount <= MAX_INLINE_RESULTS) {
        // Small result set - include full list
        llmContent = `Found ${result.matchCount} match(es) for pattern "${this.params.pattern}" in ${result.searchPath}:\n\n${preview}`;
        returnDisplay = `Found ${result.matchCount} matches:\n${preview}`;
      } else {
        // Large result set - show reference and preview
        llmContent = `Found ${result.matchCount} matches for pattern "${this.params.pattern}" in ${result.searchPath}.\n\nFirst ${PREVIEW_LINES} results:\n${preview}\n\nFull results available at: ${result.outputPath}\nTo read all results, use the read_file tool with this path.`;
        returnDisplay = `Found ${result.matchCount} matches (too many to display).\n\nFirst ${PREVIEW_LINES} results:\n${preview}\n\nResults file: ${result.outputPath}`;
      }

      return {
        llmContent,
        returnDisplay,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        llmContent: `ripgrep search error: ${message}`,
        returnDisplay: `Error: ${message}`,
        error: {
          message,
          type: ToolErrorType.GREP_EXECUTION_ERROR,
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

function getNativeRipgrepToolDescription(): string {
  return `Native text search using ripgrep with direct-to-disk output handling.

**Advantages over standard ripgrep:**
- Handles large result sets efficiently (no memory buffering)
- Suitable for searching large codebases (100k+ files)
- Results written directly to disk, LLM receives only summary
- Reduces context usage significantly for large searches

**Parameters:**
- \`pattern\`: Regex pattern to search for (required)
- \`searchPath\`: Directory to search in (default: current directory)
- \`glob\`: Glob pattern to filter files (e.g., "*.ts", "**/*.tsx")
- \`caseSensitive\`: Case-sensitive matching (default: false)
- \`fileTypes\`: Filter by file type (e.g., ["ts", "tsx"])
- \`maxCount\`: Limit number of matches
- \`useSmartSearch\`: Enable smart search with intelligent filtering

**Results:**
- Small results (<100 matches): Full list included in response
- Large results (>100 matches): Preview shown, full results in file reference`;
}

export class NativeRipgrepTool extends BaseDeclarativeTool<
  NativeRipgrepToolParams,
  ToolResult
> {
  static Name: string = ToolNames.RIPGREP;

  constructor(private readonly config: Config) {
    super(
      NativeRipgrepTool.Name,
      ToolDisplayNames.RIPGREP,
      getNativeRipgrepToolDescription(),
      Kind.Search,
      {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'Regex pattern to search for in files',
          },
          searchPath: {
            type: 'string',
            description: 'Directory to search in (default: current directory)',
          },
          glob: {
            type: 'string',
            description:
              'Glob pattern to filter files (e.g., "*.ts", "**/*.tsx")',
          },
          caseSensitive: {
            type: 'boolean',
            description: 'Case-sensitive matching (default: false)',
          },
          fileTypes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by file type (e.g., ["ts", "tsx", "js"])',
          },
          maxCount: {
            type: 'number',
            description: 'Limit number of matches',
          },
          useSmartSearch: {
            type: 'boolean',
            description: 'Enable smart search with intelligent filtering',
          },
        },
        required: ['pattern'],
      } as Record<string, unknown>,
      false, // not markdown
      false, // cannot update output
    );
  }

  protected override validateToolParamValues(
    params: NativeRipgrepToolParams,
  ): string | null {
    // Validate pattern
    if (!params.pattern || !params.pattern.trim()) {
      return 'Pattern cannot be empty';
    }

    // Validate regex pattern
    try {
      new RegExp(params.pattern);
    } catch (error) {
      return `Invalid regex pattern: ${(error as Error).message}`;
    }

    // Validate searchPath if provided
    if (params.searchPath) {
      if (!path.isAbsolute(params.searchPath)) {
        // Allow relative paths for ripgrep
        params.searchPath = path.resolve(params.searchPath);
      }
    }

    // Validate maxCount
    if (params.maxCount !== null && params.maxCount !== undefined) {
      if (params.maxCount < 1) {
        return 'maxCount must be at least 1';
      }
    }

    return null;
  }

  protected createInvocation(
    params: NativeRipgrepToolParams,
  ): ToolInvocation<NativeRipgrepToolParams, ToolResult> {
    return new NativeRipgrepToolInvocation(this.config, params);
  }
}
