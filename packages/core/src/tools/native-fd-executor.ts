/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native FD Executor
 * Specialized executor for fd command with null-separated output handling
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

export interface FdSearchOptions extends Omit<NativeCommandOptions, 'input'> {
  args?: string[];
  fileType?: 'f' | 'd' | null;
  maxDepth?: number | null;
  caseSensitive?: boolean;
  followSymlinks?: boolean;
}

export interface FdResult extends CommandExecutionResult {
  fileCount: number;
  searchPath: string;
}

/**
 * Native FD Executor - optimized for file searching
 * Uses null-separated output for safe parsing of file paths with special chars
 */
export class NativeFdExecutor {
  private executor: NativeCommandExecutor;

  constructor(storagePath: string = '/var/storage/native') {
    this.executor = new NativeCommandExecutor({ storagePath });
  }

  /**
   * Execute fd DIRECTLY to disk - NO MEMORY BUFFER!
   */
  async executeFdDirectToDisk(
    pattern: string,
    searchPath: string = '.',
    options: FdSearchOptions = {},
  ): Promise<FdResult> {
    const {
      args = [],
      fileType = null,
      maxDepth = null,
      caseSensitive = false,
      followSymlinks = false,
      cwd = searchPath,
    } = options;

    // Build fd command arguments
    const fdArgs = [pattern, searchPath];

    // Add additional args
    if (args.length > 0) {
      fdArgs.push(...args);
    }

    // Add common options
    if (fileType) {
      fdArgs.push('--type', fileType);
    }

    if (maxDepth !== null) {
      fdArgs.push('--max-depth', maxDepth.toString());
    }

    if (!caseSensitive) {
      fdArgs.push('--ignore-case');
    }

    if (followSymlinks) {
      fdArgs.push('--follow');
    }

    // Add null separator for safe parsing
    fdArgs.push('--print0');

    console.log(`[NativeFd] Executing: fd ${fdArgs.join(' ')}`);

    // Execute via native command executor
    const result = await this.executor.executeCommandDirectToDisk(
      'fd',
      fdArgs,
      {
        cwd,
      },
    );

    // Count files found (using null separator)
    const fileCount = await this.countFiles(result.outputPath);

    return {
      ...result,
      fileCount,
      searchPath,
    };
  }

  /**
   * Count files in null-separated output
   */
  private async countFiles(filePath: string): Promise<number> {
    try {
      // Read file and count null bytes
      const buffer = fs.readFileSync(filePath);
      let count = 0;
      for (const byte of buffer) {
        if (byte === 0) count++;
      }
      return count;
    } catch {
      // Fallback: count lines
      try {
        const { stdout } = await execFileAsync('wc', ['-l', filePath]);
        return parseInt(stdout.trim().split(' ')[0], 10) || 0;
      } catch {
        return 0;
      }
    }
  }

  /**
   * Get preview of results (convert null-separated to readable format)
   */
  async getFdPreview(filePath: string, maxLines: number = 50): Promise<string> {
    try {
      // Read file and convert null-separated to newline-separated
      const buffer = fs.readFileSync(filePath);
      const text = buffer.toString('utf8').replace(/\0/g, '\n').trim();
      const lines = text.split('\n').slice(0, maxLines);
      return lines.join('\n');
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
   * Smart FD search with intelligent filtering
   */
  async smartFdSearch(
    pattern: string,
    searchPath: string,
    filters: {
      extensions?: string[];
      excludeDirs?: string[];
      minSize?: string | null;
      maxSize?: string | null;
      modifiedDays?: number | null;
    } = {},
    executorOptions?: { signal?: AbortSignal },
  ): Promise<FdResult> {
    const {
      extensions = null,
      excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build'],
      minSize = null,
      maxSize = null,
      modifiedDays = null,
    } = filters;

    const args: string[] = [];

    // Add extension filters
    if (extensions && extensions.length > 0) {
      extensions.forEach((ext) => {
        args.push('--extension', ext);
      });
    }

    // Add exclude directories
    excludeDirs.forEach((dir) => {
      args.push('--exclude', `**/${dir}/**`);
    });

    // Add size filters
    if (minSize !== null || maxSize !== null) {
      let sizeArg = '';
      if (minSize !== null) sizeArg += `+${minSize}`;
      if (maxSize !== null) sizeArg += `-${maxSize}`;
      if (sizeArg) args.push('--size', sizeArg);
    }

    // Add time filters
    if (modifiedDays !== null) {
      args.push('--changed-within', `${modifiedDays}d`);
    }

    return await this.executeFdDirectToDisk(pattern, searchPath, {
      args,
      fileType: 'f', // files only for smart search
      signal: executorOptions?.signal,
    });
  }
}
