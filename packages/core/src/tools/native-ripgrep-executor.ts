/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native Ripgrep Executor
 * Specialized executor for ripgrep with zero-memory buffering and line-based output
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { promisify } from 'node:util';
import {
  NativeCommandExecutor,
  type NativeCommandOptions,
  type CommandExecutionResult,
} from './native-command-executor.js';

const execFileAsync = promisify(execFile);

export interface RipgrepSearchOptions
  extends Omit<NativeCommandOptions, 'input'> {
  args?: string[];
  glob?: string | null;
  caseSensitive?: boolean;
  fileTypes?: string[];
  maxCount?: number | null;
}

export interface RipgrepResult extends CommandExecutionResult {
  matchCount: number;
  searchPath: string;
}

/**
 * Native Ripgrep Executor - optimized for text searching
 * Uses line-based output for efficient parsing of search results
 */
export class NativeRipgrepExecutor {
  private executor: NativeCommandExecutor;

  constructor(storagePath: string = '/var/storage/native') {
    this.executor = new NativeCommandExecutor({ storagePath });
  }

  /**
   * Execute ripgrep DIRECTLY to disk - NO MEMORY BUFFER!
   */
  async executeRipgrepDirectToDisk(
    pattern: string,
    searchPath: string = '.',
    options: RipgrepSearchOptions = {},
  ): Promise<RipgrepResult> {
    const {
      args = [],
      glob = null,
      caseSensitive = false,
      fileTypes = [],
      maxCount = null,
      cwd = searchPath,
    } = options;

    // Build ripgrep command arguments
    const rgArgs = [
      '--line-number',
      '--no-heading',
      '--with-filename',
      '--color',
      'never', // Don't include ANSI codes
      '--regexp',
      pattern,
    ];

    // Add additional args
    if (args.length > 0) {
      rgArgs.push(...args);
    }

    // Add case sensitivity
    if (!caseSensitive) {
      rgArgs.push('--ignore-case');
    }

    // Add file type filters
    if (fileTypes.length > 0) {
      fileTypes.forEach((type) => {
        rgArgs.push('--type', type);
      });
    }

    // Add glob pattern
    if (glob) {
      rgArgs.push('--glob', glob);
    }

    // Add max count
    if (maxCount !== null && maxCount > 0) {
      rgArgs.push('--max-count', maxCount.toString());
    }

    // Add search path
    rgArgs.push(searchPath);

    console.log(`[NativeRipgrep] Executing: rg ${rgArgs.join(' ')}`);

    // Execute via native command executor
    const result = await this.executor.executeCommandDirectToDisk(
      'rg',
      rgArgs,
      {
        cwd,
      },
    );

    // Count matches (lines in output = matches)
    const matchCount = await this.countMatches(result.outputPath);

    return {
      ...result,
      matchCount,
      searchPath,
    };
  }

  /**
   * Count matches by counting lines in output
   */
  private async countMatches(filePath: string): Promise<number> {
    try {
      // Read file and count lines
      const buffer = fs.readFileSync(filePath);
      let count = 0;
      for (const byte of buffer) {
        if (byte === 10) count++; // newline byte
      }
      // If file doesn't end with newline, add 1
      if (buffer.length > 0 && buffer[buffer.length - 1] !== 10) {
        count++;
      }
      return count;
    } catch {
      // Fallback: count lines using wc
      try {
        const { stdout } = await execFileAsync('wc', ['-l', filePath]);
        return parseInt(stdout.trim().split(' ')[0], 10) || 0;
      } catch {
        return 0;
      }
    }
  }

  /**
   * Get preview of results (first N lines)
   */
  async getRipgrepPreview(
    filePath: string,
    maxLines: number = 50,
  ): Promise<string> {
    try {
      // Read file line by line
      const buffer = fs.readFileSync(filePath);
      const text = buffer.toString('utf8');
      const lines = text.split('\n').slice(0, maxLines);
      return lines.join('\n').trim();
    } catch {
      // Fallback: use head command
      try {
        const { stdout } = await execFileAsync('head', [
          `-${maxLines}`,
          filePath,
        ]);
        return stdout;
      } catch {
        return '(Unable to preview results)';
      }
    }
  }

  /**
   * Smart ripgrep search with intelligent filtering
   */
  async smartRipgrepSearch(
    pattern: string,
    searchPath: string,
    filters: {
      glob?: string | null;
      fileTypes?: string[];
      maxCount?: number | null;
      caseSensitive?: boolean;
    } = {},
    executorOptions?: { signal?: AbortSignal },
  ): Promise<RipgrepResult> {
    const {
      glob = null,
      fileTypes = [],
      maxCount = null,
      caseSensitive = false,
    } = filters;

    const args: string[] = [];

    // Add file type filters
    if (fileTypes && fileTypes.length > 0) {
      fileTypes.forEach((type) => {
        args.push('--type', type);
      });
    }

    // Add max count if specified
    if (maxCount && maxCount > 0) {
      args.push('--max-count', maxCount.toString());
    }

    // Add ignore common directories
    const excludeDirs = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      '.venv',
    ];
    excludeDirs.forEach((dir) => {
      args.push('--exclude', dir);
    });

    return await this.executeRipgrepDirectToDisk(pattern, searchPath, {
      args,
      glob: glob ?? null,
      caseSensitive: caseSensitive ?? false,
      signal: executorOptions?.signal,
    });
  }
}
