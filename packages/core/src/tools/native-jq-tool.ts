/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native JQ Tool
 * JSON processor tool with native jq and direct-to-disk output handling
 */

import path from 'node:path';
import type { Config } from '../config/config.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import { ToolErrorType } from './tool-error.js';
import type { ToolInvocation, ToolResult, ToolResultDisplay } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { NativeJqExecutor } from './native-jq-executor.js';

const MAX_INLINE_RESULTS = 100;
const PREVIEW_LINES = 50;

export interface NativeJqToolParams {
  filter: string;
  inputFile?: string;
  rawData?: string;
  compactOutput?: boolean;
  rawOutput?: boolean;
  slurp?: boolean;
  rawInput?: boolean;
  sortKeys?: boolean;
  argVars?: Record<string, string>;
  argJsonVars?: Record<string, unknown>;
}

export class NativeJqToolInvocation extends BaseToolInvocation<
  NativeJqToolParams,
  ToolResult
> {
  constructor(_config: Config, params: NativeJqToolParams) {
    super(params);
  }

  getDescription(): string {
    let description = `Process JSON with jq filter: "${this.params.filter}"`;

    if (this.params.inputFile) {
      description += ` on file ${this.params.inputFile}`;
    } else {
      description += ' on raw JSON data';
    }

    const flags = [];
    if (this.params.compactOutput) flags.push('-c');
    if (this.params.rawOutput) flags.push('-r');
    if (this.params.slurp) flags.push('-s');
    if (this.params.rawInput) flags.push('-R');
    if (this.params.sortKeys) flags.push('-S');

    if (flags.length > 0) {
      description += ` [flags: ${flags.join(' ')}]`;
    }

    return description;
  }

  async execute(
    signal: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    try {
      const executor = new NativeJqExecutor();

      // Determine input method
      let result;
      if (this.params.inputFile) {
        // Process file input
        result = await executor.executeJqOnFile(
          this.params.filter,
          this.params.inputFile,
          {
            compactOutput: this.params.compactOutput,
            rawOutput: this.params.rawOutput,
            slurp: this.params.slurp,
            rawInput: this.params.rawInput,
            sortKeys: this.params.sortKeys,
            argVars: this.params.argVars,
            argJsonVars: this.params.argJsonVars,
            signal,
          },
        );
      } else if (this.params.rawData) {
        // Process raw JSON data
        result = await executor.executeJqOnData(
          this.params.filter,
          this.params.rawData,
          {
            compactOutput: this.params.compactOutput,
            rawOutput: this.params.rawOutput,
            slurp: this.params.slurp,
            rawInput: this.params.rawInput,
            sortKeys: this.params.sortKeys,
            argVars: this.params.argVars,
            argJsonVars: this.params.argJsonVars,
            signal,
          },
        );
      } else {
        return {
          llmContent: 'Error: Either inputFile or rawData must be provided',
          returnDisplay: 'Error: Either inputFile or rawData must be provided',
          error: {
            message: 'Either inputFile or rawData must be provided',
            type: ToolErrorType.JQ_EXECUTION_ERROR,
          },
        };
      }

      // Handle result
      if (!result.success) {
        const errorContent = await this.readErrorFile(result.errorPath);
        return {
          llmContent: `jq processing failed: ${errorContent}`,
          returnDisplay: `Error: ${errorContent}`,
          error: {
            message: `jq processing failed with exit code ${result.exitCode}`,
            type: ToolErrorType.JQ_EXECUTION_ERROR,
          },
        };
      }

      // Success - format result based on output size
      const preview = await executor.getJqPreview(
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
        `[NativeJqTool] Output file size: ${outputSizeStr} (${result.outputSize} bytes)`,
      );
      console.log(`[NativeJqTool] Output path: ${result.outputPath}`);

      let llmContent = '';
      let returnDisplay = '';

      if (result.outputSize <= MAX_INLINE_RESULTS) {
        // Small result - include full content
        llmContent = `Processed JSON with jq filter "${this.params.filter}":\n\n${preview}\n\n📊 Output: ${outputSizeStr} (${result.outputPath})`;
        returnDisplay = `Result:\n${preview}`;
      } else {
        // Large result - show reference and preview
        llmContent = `Processed JSON with jq filter "${this.params.filter}".\n\nFirst ${PREVIEW_LINES} characters:\n${preview}\n\nFull result available at: ${result.outputPath}\n📊 Output file size: ${outputSizeStr}\nTo read the complete result, use the read_file tool with this path.`;
        returnDisplay = `Processed JSON with jq filter "${this.params.filter}" (large output).\n\nFirst ${PREVIEW_LINES} characters:\n${preview}\n\nResult file: ${result.outputPath} (${outputSizeStr})`;
      }

      return {
        llmContent,
        returnDisplay,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        llmContent: `jq processing error: ${message}`,
        returnDisplay: `Error: ${message}`,
        error: {
          message,
          type: ToolErrorType.JQ_EXECUTION_ERROR,
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

function getNativeJqToolDescription(): string {
  return `Native JSON processor using jq with direct-to-disk output handling.

**Advantages over standard approaches:**
- Handles large JSON files efficiently (no memory buffering)
- Suitable for processing large JSON datasets
- Results written directly to disk, LLM receives only summary
- Reduces context usage significantly for large outputs

**Parameters:**
- \`filter\`: jq filter expression to apply (required)
- \`inputFile\`: Path to JSON input file (alternative to rawData)
- \`rawData\`: Raw JSON string to process (alternative to inputFile)
- \`compactOutput\`: Use compact output (-c flag)
- \`rawOutput\`: Output raw strings, not JSON texts (-r flag)
- \`slurp\`: Read input as sequence of JSON texts (-s flag)
- \`rawInput\`: Read input as raw strings, not JSON texts (-R flag)
- \`sortKeys\`: Sort object keys in output (-S flag)
- \`argVars\`: Variables to pass to the jq program (-arg option)
- \`argJsonVars\`: JSON variables to pass to the jq program (-argjson option)

**Results:**
- Small results: Full content included in response
- Large results: Preview shown, full result in file reference`;
}

export class NativeJqTool extends BaseDeclarativeTool<
  NativeJqToolParams,
  ToolResult
> {
  static Name: string = ToolNames.JQ;

  constructor(private readonly config: Config) {
    super(
      NativeJqTool.Name,
      ToolDisplayNames.JQ,
      getNativeJqToolDescription(),
      Kind.Execute,
      {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            description: 'jq filter expression to apply to JSON data',
          },
          inputFile: {
            type: 'string',
            description:
              'Path to JSON input file (provide either inputFile or rawData)',
          },
          rawData: {
            type: 'string',
            description:
              'Raw JSON string to process (provide either inputFile or rawData)',
          },
          compactOutput: {
            type: 'boolean',
            description: 'Use compact output (no extra whitespace)',
          },
          rawOutput: {
            type: 'boolean',
            description: 'Output raw strings, not JSON texts',
          },
          slurp: {
            type: 'boolean',
            description: 'Read input as sequence of JSON texts',
          },
          rawInput: {
            type: 'boolean',
            description: 'Read input as raw strings, not JSON texts',
          },
          sortKeys: {
            type: 'boolean',
            description: 'Sort object keys in output',
          },
          argVars: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'Variables to pass to the jq program',
          },
          argJsonVars: {
            type: 'object',
            additionalProperties: true,
            description: 'JSON variables to pass to the jq program',
          },
        },
        required: ['filter'],
      } as Record<string, unknown>,
      false, // not markdown
      false, // cannot update output
    );
  }

  protected override validateToolParamValues(
    params: NativeJqToolParams,
  ): string | null {
    // Validate filter
    if (!params.filter || !params.filter.trim()) {
      return 'Filter cannot be empty';
    }

    // Validate that either inputFile or rawData is provided
    if (!params.inputFile && !params.rawData) {
      return 'Either inputFile or rawData must be provided';
    }

    // Validate that both inputFile and rawData are not provided
    if (params.inputFile && params.rawData) {
      return 'Provide either inputFile or rawData, not both';
    }

    // Validate inputFile if provided
    if (params.inputFile) {
      if (!path.isAbsolute(params.inputFile)) {
        return 'inputFile must be an absolute path';
      }
    }

    // Validate filter syntax by attempting to compile it (optional validation)
    try {
      // We could try to validate the filter syntax by running a simple test
      // but this is complex, so we'll skip it for now and rely on runtime validation
    } catch (error) {
      return `Invalid jq filter syntax: ${(error as Error).message}`;
    }

    return null;
  }

  protected createInvocation(
    params: NativeJqToolParams,
  ): ToolInvocation<NativeJqToolParams, ToolResult> {
    return new NativeJqToolInvocation(this.config, params);
  }
}
