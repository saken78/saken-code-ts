/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native Command Executor
 * Executes system commands with output piped DIRECTLY to disk
 * Zero memory buffering - suitable for large result sets (MB/GB)
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

export interface NativeCommandOptions {
  cwd?: string;
  input?: string | null;
  timeoutMs?: number;
  signal?: AbortSignal;
  env?: Record<string, string>;
  shell?: boolean;
}

export interface CommandExecutionResult {
  success: boolean;
  exitCode: number | null;
  outputPath: string;
  errorPath: string;
  outputSize: number;
  errorSize: number;
  executionTime: number;
  command: string;
}

/**
 * Execute ANY command with output DIRECTLY to disk
 * No memory buffering - streams stdout/stderr to files
 */
export class NativeCommandExecutor {
  private storagePath: string;
  private defaultTimeoutMs: number;

  constructor(
    options: { storagePath?: string; defaultTimeoutMs?: number } = {},
  ) {
    // Use provided storagePath, or fallback to temp directory if /var/storage/native isn't available
    this.storagePath = options.storagePath || this.getDefaultStoragePath();
    this.defaultTimeoutMs = options.defaultTimeoutMs || 300000; // 5 minutes
  }

  /**
   * Get default storage path with fallback to system temp directory
   */
  private getDefaultStoragePath(): string {
    const primaryPath = '/var/storage/native';
    const tempPath = path.join(os.tmpdir(), 'qwen-native-commands');

    // Try to use primary path, fall back to temp directory
    try {
      // Check if we can access /var
      fs.accessSync('/var');
      return primaryPath;
    } catch {
      // Fallback to system temp directory
      console.log(
        `[NativeCommand] Primary storage path "${primaryPath}" not accessible, using temp directory: ${tempPath}`,
      );
      return tempPath;
    }
  }

  /**
   * Execute command with output directly to disk
   */
  async executeCommandDirectToDisk(
    command: string,
    args: string[] = [],
    options: NativeCommandOptions = {},
  ): Promise<CommandExecutionResult> {
    const {
      cwd = '.',
      input = null,
      timeoutMs = this.defaultTimeoutMs,
      signal = null,
      env = process.env,
      shell = false,
    } = options;

    // Generate unique output files
    const timestamp = Date.now();
    const random = crypto.randomBytes(6).toString('hex');
    const outputFile = path.join(
      this.storagePath,
      `${command}_${timestamp}_${random}.txt`,
    );
    const errorFile = path.join(
      this.storagePath,
      `${command}_${timestamp}_${random}_error.txt`,
    );

    await this.ensureStorageDirectory();

    console.log(`[NativeCommand] Executing: ${command} ${args.join(' ')}`);
    console.log(`[NativeCommand] Output: ${outputFile}`);

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      // Create write streams
      const outputStream = fs.createWriteStream(outputFile);
      const errorStream = fs.createWriteStream(errorFile);

      // Spawn process with output DIRECT to files
      const spawnOptions: {
        cwd?: string;
        env?: NodeJS.ProcessEnv;
        shell?: boolean;
        stdio: ['pipe', 'pipe', 'pipe'];
        signal?: AbortSignal;
      } = {
        cwd,
        env: env as NodeJS.ProcessEnv,
        shell,
        stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
      };

      // Only add signal if it's not null or undefined
      if (signal != null) {
        spawnOptions.signal = signal;
      }

      const child = spawn(command, args, spawnOptions);

      // Write input if provided
      if (input !== null) {
        child.stdin?.write(input);
        child.stdin?.end();
      } else {
        child.stdin?.end();
      }

      // PIPE DIRECTLY TO FILES - NO MEMORY!
      child.stdout?.pipe(outputStream);
      child.stderr?.pipe(errorStream);

      // Timeout handling
      let timeoutId: NodeJS.Timeout | undefined;
      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          if (!child.killed) {
            try {
              child.kill('SIGTERM');
            } catch (e) {
              console.error('[NativeCommand] Error killing process:', e);
            }
          }
        }, timeoutMs);
      }

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        outputStream.end();
        errorStream.end();
        reject(new Error(`Failed to start ${command}: ${error.message}`));
      });

      child.on('close', async (code) => {
        clearTimeout(timeoutId);
        outputStream.end();
        errorStream.end();

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        try {
          // Get file stats
          const outputStats = fs.statSync(outputFile);
          const errorStats = fs.statSync(errorFile);

          resolve({
            success: code === 0,
            exitCode: code,
            outputPath: outputFile,
            errorPath: errorFile,
            outputSize: outputStats.size,
            errorSize: errorStats.size,
            executionTime,
            command: `${command} ${args.join(' ')}`,
          });
        } catch (statsError) {
          reject(
            new Error(
              `Failed to get result stats: ${(statsError as Error).message}`,
            ),
          );
        }
      });
    });
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      // Check if directory exists
      const stats = await fs.promises.stat(this.storagePath);
      if (!stats.isDirectory()) {
        throw new Error(
          `Storage path exists but is not a directory: ${this.storagePath}`,
        );
      }
    } catch (error) {
      // Try to create the directory
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        try {
          await fs.promises.mkdir(this.storagePath, { recursive: true });
          console.log(
            `[NativeCommand] Created storage directory: ${this.storagePath}`,
          );
        } catch (mkdirError) {
          throw new Error(
            `Failed to create storage directory "${this.storagePath}": ${(mkdirError as Error).message}`,
          );
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Format bytes to human-readable size
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
