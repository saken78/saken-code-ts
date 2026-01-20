/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native JQ Executor
 * Specialized executor for jq with zero-memory buffering for JSON processing
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

export interface JqOperationOptions
  extends Omit<NativeCommandOptions, 'input'> {
  args?: string[];
  compactOutput?: boolean;
  rawOutput?: boolean;
  slurp?: boolean;
  rawInput?: boolean;
  sortKeys?: boolean;
  argVars?: Record<string, string>;
  argJsonVars?: Record<string, unknown>;
}

export interface JqResult extends CommandExecutionResult {
  inputSize: number;
  outputSize: number;
}

/**
 * Native JQ Executor - optimized for JSON processing
 * Uses direct-to-disk output for efficient handling of large JSON datasets
 */
export class NativeJqExecutor {
  private executor: NativeCommandExecutor;

  constructor(storagePath: string = '/var/storage/native') {
    this.executor = new NativeCommandExecutor({ storagePath });
  }

  /**
   * Execute jq on a file DIRECTLY to disk - NO MEMORY BUFFER!
   */
  async executeJqOnFile(
    filter: string,
    filePath: string,
    options: JqOperationOptions = {},
  ): Promise<JqResult> {
    const {
      compactOutput = false,
      rawOutput = false,
      slurp = false,
      rawInput = false,
      sortKeys = false,
      argVars = {},
      argJsonVars = {},
      cwd = '.',
    } = options;

    // Build jq command arguments
    const jqArgs = [];

    // Add flags
    if (compactOutput) jqArgs.push('-c');
    if (rawOutput) jqArgs.push('-r');
    if (slurp) jqArgs.push('-s');
    if (rawInput) jqArgs.push('-R');
    if (sortKeys) jqArgs.push('-S');

    // Add variable arguments
    for (const [key, value] of Object.entries(argVars)) {
      jqArgs.push('--arg', key, value);
    }

    for (const [key, value] of Object.entries(argJsonVars)) {
      jqArgs.push('--argjson', key, JSON.stringify(value));
    }

    // Add the filter
    jqArgs.push(filter);

    // Add the input file
    jqArgs.push(filePath);

    console.log(`[NativeJq] Executing: jq ${jqArgs.join(' ')}`);

    // Execute via native command executor
    const result = await this.executor.executeCommandDirectToDisk(
      'jq',
      jqArgs,
      {
        cwd,
      },
    );

    // Calculate input size
    const inputStats = fs.statSync(filePath);
    const inputSize = inputStats.size;

    return {
      ...result,
      inputSize,
      outputSize: result.outputSize,
    };
  }

  /**
   * Execute jq on raw JSON data DIRECTLY to disk - NO MEMORY BUFFER!
   */
  async executeJqOnData(
    filter: string,
    jsonData: string,
    options: JqOperationOptions = {},
  ): Promise<JqResult> {
    const {
      compactOutput = false,
      rawOutput = false,
      slurp = false,
      rawInput = false,
      sortKeys = false,
      argVars = {},
      argJsonVars = {},
      cwd = '.',
    } = options;

    // Build jq command arguments
    const jqArgs = [];

    // Add flags
    if (compactOutput) jqArgs.push('-c');
    if (rawOutput) jqArgs.push('-r');
    if (slurp) jqArgs.push('-s');
    if (rawInput) jqArgs.push('-R');
    if (sortKeys) jqArgs.push('-S');

    // Add variable arguments
    for (const [key, value] of Object.entries(argVars)) {
      jqArgs.push('--arg', key, value);
    }

    for (const [key, value] of Object.entries(argJsonVars)) {
      jqArgs.push('--argjson', key, JSON.stringify(value));
    }

    // Add the filter
    jqArgs.push(filter);

    console.log(`[NativeJq] Executing: jq ${jqArgs.join(' ')} (on input data)`);

    // Execute via native command executor with input data
    const result = await this.executor.executeCommandDirectToDisk(
      'jq',
      jqArgs,
      {
        cwd,
        input: jsonData,
      },
    );

    const inputSize = Buffer.byteLength(jsonData, 'utf8');

    return {
      ...result,
      inputSize,
      outputSize: result.outputSize,
    };
  }

  /**
   * Get preview of results (first N lines or characters)
   */
  async getJqPreview(
    filePath: string,
    maxLength: number = 50,
  ): Promise<string> {
    try {
      // Read file and get first N characters
      const buffer = fs.readFileSync(filePath);
      const text = buffer.toString('utf8');
      const preview =
        text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      return preview;
    } catch {
      // Fallback: use head command to get first N characters
      try {
        const { stdout } = await execFileAsync('head', [
          `-c`,
          `${maxLength}`,
          filePath,
        ]);
        return stdout.length === maxLength ? stdout + '...' : stdout;
      } catch {
        return '(Unable to preview results)';
      }
    }
  }

  /**
   * Smart jq operation with intelligent handling
   */
  async smartJqOperation(
    filter: string,
    inputSource: string | null = null, // file path or null for raw data
    rawData: string | null = null, // raw data or null if using file
    options: {
      compactOutput?: boolean;
      rawOutput?: boolean;
      slurp?: boolean;
      rawInput?: boolean;
      sortKeys?: boolean;
      argVars?: Record<string, string>;
      argJsonVars?: Record<string, unknown>;
    } = {},
    executorOptions?: { signal?: AbortSignal },
  ): Promise<JqResult> {
    const {
      compactOutput = false,
      rawOutput = false,
      slurp = false,
      rawInput = false,
      sortKeys = false,
      argVars = {},
      argJsonVars = {},
    } = options;

    if (inputSource) {
      // Process file input
      return await this.executeJqOnFile(filter, inputSource, {
        compactOutput,
        rawOutput,
        slurp,
        rawInput,
        sortKeys,
        argVars,
        argJsonVars,
        signal: executorOptions?.signal,
      });
    } else if (rawData) {
      // Process raw data input
      return await this.executeJqOnData(filter, rawData, {
        compactOutput,
        rawOutput,
        slurp,
        rawInput,
        sortKeys,
        argVars,
        argJsonVars,
        signal: executorOptions?.signal,
      });
    } else {
      throw new Error(
        'Either inputSource (file path) or rawData must be provided',
      );
    }
  }
}
