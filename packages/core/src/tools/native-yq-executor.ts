/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native YQ Executor
 * Specialized executor for yq with zero-memory buffering for YAML processing
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

export interface YqOperationOptions
  extends Omit<NativeCommandOptions, 'input'> {
  args?: string[];
  yamlOutput?: boolean;
  yamlRoundtrip?: boolean;
  yamlOutputGrammarVersion?: '1.1' | '1.2';
  width?: number;
  indentlessLists?: boolean;
  explicitStart?: boolean;
  explicitEnd?: boolean;
  inPlace?: boolean;
  compactOutput?: boolean;
  rawOutput?: boolean;
  slurp?: boolean;
  rawInput?: boolean;
  sortKeys?: boolean;
  argVars?: Record<string, string>;
  argJsonVars?: Record<string, unknown>;
}

export interface YqResult extends CommandExecutionResult {
  inputSize: number;
  outputSize: number;
}

/**
 * Native YQ Executor - optimized for YAML processing
 * Uses direct-to-disk output for efficient handling of large YAML datasets
 */
export class NativeYqExecutor {
  private executor: NativeCommandExecutor;

  constructor(storagePath: string = '/var/storage/native') {
    this.executor = new NativeCommandExecutor({ storagePath });
  }

  /**
   * Execute yq on a file DIRECTLY to disk - NO MEMORY BUFFER!
   */
  async executeYqOnFile(
    filter: string,
    filePath: string,
    options: YqOperationOptions = {},
  ): Promise<YqResult> {
    const {
      yamlOutput = false,
      yamlRoundtrip = false,
      yamlOutputGrammarVersion,
      width,
      indentlessLists = false,
      explicitStart = false,
      explicitEnd = false,
      inPlace = false,
      compactOutput = false,
      rawOutput = false,
      slurp = false,
      rawInput = false,
      sortKeys = false,
      argVars = {},
      argJsonVars = {},
      cwd = '.',
    } = options;

    // Build yq command arguments
    const yqArgs = [];

    // Add flags
    if (yamlOutput) yqArgs.push('-y');
    if (yamlRoundtrip) yqArgs.push('-Y');
    if (yamlOutputGrammarVersion) {
      yqArgs.push('--yaml-output-grammar-version', yamlOutputGrammarVersion);
    }
    if (width !== undefined) yqArgs.push('-w', width.toString());
    if (indentlessLists) yqArgs.push('--indentless');
    if (explicitStart) yqArgs.push('--explicit-start');
    if (explicitEnd) yqArgs.push('--explicit-end');
    if (inPlace) yqArgs.push('-i');
    if (compactOutput) yqArgs.push('-c');
    if (rawOutput) yqArgs.push('-r');
    if (slurp) yqArgs.push('-s');
    if (rawInput) yqArgs.push('-R');
    if (sortKeys) yqArgs.push('-S');

    // Add variable arguments (for jq functionality)
    for (const [key, value] of Object.entries(argVars)) {
      yqArgs.push('--arg', key, value);
    }

    for (const [key, value] of Object.entries(argJsonVars)) {
      yqArgs.push('--argjson', key, JSON.stringify(value));
    }

    // Add the filter
    yqArgs.push(filter);

    // Add the input file
    yqArgs.push(filePath);

    console.log(`[NativeYq] Executing: yq ${yqArgs.join(' ')}`);

    // Execute via native command executor
    const result = await this.executor.executeCommandDirectToDisk(
      'yq',
      yqArgs,
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
   * Execute yq on raw YAML data DIRECTLY to disk - NO MEMORY BUFFER!
   */
  async executeYqOnData(
    filter: string,
    yamlData: string,
    options: YqOperationOptions = {},
  ): Promise<YqResult> {
    const {
      yamlOutput = false,
      yamlRoundtrip = false,
      yamlOutputGrammarVersion,
      width,
      indentlessLists = false,
      explicitStart = false,
      explicitEnd = false,
      compactOutput = false,
      rawOutput = false,
      slurp = false,
      rawInput = false,
      sortKeys = false,
      argVars = {},
      argJsonVars = {},
      cwd = '.',
    } = options;

    // Build yq command arguments
    const yqArgs = [];

    // Add flags
    if (yamlOutput) yqArgs.push('-y');
    if (yamlRoundtrip) yqArgs.push('-Y');
    if (yamlOutputGrammarVersion) {
      yqArgs.push('--yaml-output-grammar-version', yamlOutputGrammarVersion);
    }
    if (width !== undefined) yqArgs.push('-w', width.toString());
    if (indentlessLists) yqArgs.push('--indentless');
    if (explicitStart) yqArgs.push('--explicit-start');
    if (explicitEnd) yqArgs.push('--explicit-end');
    if (compactOutput) yqArgs.push('-c');
    if (rawOutput) yqArgs.push('-r');
    if (slurp) yqArgs.push('-s');
    if (rawInput) yqArgs.push('-R');
    if (sortKeys) yqArgs.push('-S');

    // Add variable arguments (for jq functionality)
    for (const [key, value] of Object.entries(argVars)) {
      yqArgs.push('--arg', key, value);
    }

    for (const [key, value] of Object.entries(argJsonVars)) {
      yqArgs.push('--argjson', key, JSON.stringify(value));
    }

    // Add the filter
    yqArgs.push(filter);

    console.log(`[NativeYq] Executing: yq ${yqArgs.join(' ')} (on input data)`);

    // Execute via native command executor with input data
    const result = await this.executor.executeCommandDirectToDisk(
      'yq',
      yqArgs,
      {
        cwd,
        input: yamlData,
      },
    );

    const inputSize = Buffer.byteLength(yamlData, 'utf8');

    return {
      ...result,
      inputSize,
      outputSize: result.outputSize,
    };
  }

  /**
   * Get preview of results (first N characters)
   */
  async getYqPreview(
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
   * Smart yq operation with intelligent handling
   */
  async smartYqOperation(
    filter: string,
    inputSource: string | null = null, // file path or null for raw data
    rawData: string | null = null, // raw data or null if using file
    options: {
      yamlOutput?: boolean;
      yamlRoundtrip?: boolean;
      yamlOutputGrammarVersion?: '1.1' | '1.2';
      width?: number;
      indentlessLists?: boolean;
      explicitStart?: boolean;
      explicitEnd?: boolean;
      compactOutput?: boolean;
      rawOutput?: boolean;
      slurp?: boolean;
      rawInput?: boolean;
      sortKeys?: boolean;
      argVars?: Record<string, string>;
      argJsonVars?: Record<string, unknown>;
    } = {},
    executorOptions?: { signal?: AbortSignal },
  ): Promise<YqResult> {
    const {
      yamlOutput = false,
      yamlRoundtrip = false,
      yamlOutputGrammarVersion,
      width,
      indentlessLists = false,
      explicitStart = false,
      explicitEnd = false,
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
      return await this.executeYqOnFile(filter, inputSource, {
        yamlOutput,
        yamlRoundtrip,
        yamlOutputGrammarVersion,
        width,
        indentlessLists,
        explicitStart,
        explicitEnd,
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
      return await this.executeYqOnData(filter, rawData, {
        yamlOutput,
        yamlRoundtrip,
        yamlOutputGrammarVersion,
        width,
        indentlessLists,
        explicitStart,
        explicitEnd,
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
