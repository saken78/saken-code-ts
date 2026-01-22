/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native Eza Executor
 * Specialized executor for eza (modern ls replacement) with zero-memory buffering and direct-to-disk output
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { promisify } from 'node:util';
// import path from 'node:path';
import {
  NativeCommandExecutor,
  type NativeCommandOptions,
  type CommandExecutionResult,
} from './native-command-executor.js';

const execFileAsync = promisify(execFile);

export interface EzaListOptions extends Omit<NativeCommandOptions, 'input'> {
  args?: string[];
  tree?: boolean;
  all?: boolean;
  long?: boolean;
  git?: boolean;
  dirsOnly?: boolean;
  filesOnly?: boolean;
  depth?: number;
  sort?: 'name' | 'size' | 'time' | 'type';
  reverse?: boolean;
  permissions?: boolean;
  owner?: boolean;
  size?: boolean;
  time?: boolean;
}

export interface EzaResult extends CommandExecutionResult {
  itemCount: number;
  searchPath: string;
}

/**
 * Native Eza Executor - optimized for file and directory listing
 * Uses direct-to-disk output for efficient handling of large directory listings
 */
export class NativeEzaExecutor {
  private executor: NativeCommandExecutor;

  constructor(storagePath: string = '/var/storage/native') {
    this.executor = new NativeCommandExecutor({ storagePath });
  }

  /**
   * Execute eza DIRECTLY to disk - NO MEMORY BUFFER!
   */
  async executeEzaDirectToDisk(
    targetPath: string = '.',
    options: EzaListOptions = {},
  ): Promise<EzaResult> {
    const {
      args = [],
      tree = false,
      all = false,
      long = false,
      git = false,
      dirsOnly = false,
      filesOnly = false,
      depth,
      sort,
      reverse = false,
      permissions = false,
      owner = false,
      size = false,
      time = false,
      cwd = targetPath,
      signal,
    } = options;

    // Build eza command arguments
    const ezaArgs = [];

    // Add additional args first
    if (args.length > 0) {
      ezaArgs.push(...args);
    }

    // Add tree option with depth if specified
    if (tree) {
      ezaArgs.push('--tree');
      if (depth !== undefined && depth > 0) {
        ezaArgs.push(`--level=${depth}`);
      }
    }

    // Add all flag
    if (all) {
      ezaArgs.push('-a');
    }

    // Add long format flag
    if (long) {
      ezaArgs.push('-l');
    }

    // Add git status flag
    if (git) {
      ezaArgs.push('--git');
    }

    // Add directories only
    if (dirsOnly) {
      ezaArgs.push('--only-dirs');
    }

    // Add files only (mutually exclusive with dirsOnly)
    if (filesOnly && !dirsOnly) {
      ezaArgs.push('--only-files');
    }

    // Add sorting
    if (sort) {
      ezaArgs.push(`--sort=${sort}`);
    }

    // Add reverse flag
    if (reverse) {
      ezaArgs.push('--reverse');
    }

    // Add permissions (requires long format)
    if (permissions) {
      if (!long) {
        ezaArgs.push('-l'); // Need long format for permissions
      }
      ezaArgs.push('--permissions');
    }

    // Add owner (requires long format)
    if (owner) {
      if (!long) {
        ezaArgs.push('-l'); // Need long format for owner
      }
      ezaArgs.push('--owner');
    }

    // Add size (requires long format)
    if (size) {
      if (!long) {
        ezaArgs.push('-l'); // Need long format for size
      }
      ezaArgs.push('--size');
    }

    // Add time (requires long format)
    if (time) {
      if (!long) {
        ezaArgs.push('-l'); // Need long format for time
      }
      ezaArgs.push('--time');
    }

    // Add target path as last argument
    ezaArgs.push(targetPath);

    console.log(`[NativeEza] Executing: eza ${ezaArgs.join(' ')}`);

    // First, check if eza exists, otherwise fall back to ls
    let command = 'eza';
    let commandArgs = ezaArgs;

    try {
      // Check if eza command exists
      await execFileAsync('which', ['eza']);
    } catch {
      // eza not found, fall back to ls
      command = 'ls';
      commandArgs = this.convertEzaArgsToLsArgs(ezaArgs, targetPath);

      console.log(
        `[NativeEza] Eza not found, falling back to: ls ${commandArgs.join(' ')}`,
      );
    }

    // Execute via native command executor
    const result = await this.executor.executeCommandDirectToDisk(
      command,
      commandArgs,
      {
        cwd,
        signal,
      },
    );

    // Count items in output
    const itemCount = await this.countItems(result.outputPath);

    return {
      ...result,
      itemCount,
      searchPath: targetPath,
    };
  }

  /**
   * Convert eza arguments to equivalent ls arguments for fallback
   */
  private convertEzaArgsToLsArgs(
    ezaArgs: string[],
    targetPath: string,
  ): string[] {
    const lsArgs: string[] = [];

    // Map eza flags to ls equivalents
    for (const arg of ezaArgs) {
      if (arg === '--tree' || arg.startsWith('--level=')) {
        // Tree mode not supported in ls, just use basic listing
        continue;
      } else if (arg === '-a' || arg.includes('--all')) {
        lsArgs.push('-a');
      } else if (arg === '-l' || arg.includes('--long')) {
        lsArgs.push('-l');
      } else if (arg.includes('--sort=')) {
        // Extract sort type
        const sortMatch = arg.match(/--sort=(.+)/);
        if (sortMatch) {
          const sortType = sortMatch[1];
          switch (sortType) {
            case 'time':
              lsArgs.push('-t');
              break;
            case 'size':
              lsArgs.push('-S');
              break;
            case 'name':
              // Default sort, no flag needed
              break;
            default:
              // Default to name sort
              break;
          }
        }
      } else if (arg === '--reverse') {
        lsArgs.push('-r');
      } else if (arg.includes('--only-dirs')) {
        lsArgs.push('-d', '*/');
      } else if (arg.includes('--only-files')) {
        // ls doesn't have only-files option, we'll just use basic listing
        continue;
      } else if (arg.includes('--git')) {
        // Git status not available in ls, skip
        continue;
      } else if (arg.includes('--permissions')) {
        if (!lsArgs.includes('-l')) {
          lsArgs.push('-l');
        }
      } else if (arg.includes('--owner')) {
        if (!lsArgs.includes('-l')) {
          lsArgs.push('-l');
        }
      } else if (arg.includes('--size')) {
        if (!lsArgs.includes('-l')) {
          lsArgs.push('-l');
        }
      } else if (arg.includes('--time')) {
        if (!lsArgs.includes('-l')) {
          lsArgs.push('-l');
        }
      }
    }

    // Add target path
    lsArgs.push(targetPath);

    return lsArgs;
  }

  /**
   * Count items by counting lines in output
   */
  private async countItems(filePath: string): Promise<number> {
    try {
      // Read file and count lines
      const buffer = fs.readFileSync(filePath);
      let count = 0;
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 10) count++; // newline byte
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
  async getEzaPreview(
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
   * Check if eza is available on the system
   */
  async isEzaAvailable(): Promise<boolean> {
    try {
      await execFileAsync('which', ['eza']);
      return true;
    } catch {
      return false;
    }
  }
}
