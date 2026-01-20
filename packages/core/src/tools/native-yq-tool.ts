/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native YQ Tool
 * YAML processor tool with native yq and direct-to-disk output handling
 */

import path from 'node:path';
import type { Config } from '../config/config.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import { ToolErrorType } from './tool-error.js';
import type { ToolInvocation, ToolResult, ToolResultDisplay } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { NativeYqExecutor } from './native-yq-executor.js';

const MAX_INLINE_RESULTS = 100;
const PREVIEW_LINES = 50;

export interface NativeYqToolParams {
  filter: string;
  inputFile?: string;
  rawData?: string;
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

export class NativeYqToolInvocation extends BaseToolInvocation<
  NativeYqToolParams,
  ToolResult
> {
  constructor(_config: Config, params: NativeYqToolParams) {
    super(params);
  }

  getDescription(): string {
    let description = `Process YAML with yq filter: "${this.params.filter}"`;

    if (this.params.inputFile) {
      description += ` on file ${this.params.inputFile}`;
    } else {
      description += ' on raw YAML data';
    }

    const flags = [];
    if (this.params.yamlOutput) flags.push('-y');
    if (this.params.yamlRoundtrip) flags.push('-Y');
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
      const executor = new NativeYqExecutor();

      // Determine input method
      let result;
      if (this.params.inputFile) {
        // Process file input
        result = await executor.smartYqOperation(
          this.params.filter,
          this.params.inputFile,
          null,
          {
            yamlOutput: this.params.yamlOutput,
            yamlRoundtrip: this.params.yamlRoundtrip,
            yamlOutputGrammarVersion: this.params.yamlOutputGrammarVersion,
            width: this.params.width,
            indentlessLists: this.params.indentlessLists,
            explicitStart: this.params.explicitStart,
            explicitEnd: this.params.explicitEnd,
            compactOutput: this.params.compactOutput,
            rawOutput: this.params.rawOutput,
            slurp: this.params.slurp,
            rawInput: this.params.rawInput,
            sortKeys: this.params.sortKeys,
            argVars: this.params.argVars,
            argJsonVars: this.params.argJsonVars,
          },
          { signal },
        );
      } else if (this.params.rawData) {
        // Process raw YAML data
        result = await executor.smartYqOperation(
          this.params.filter,
          null,
          this.params.rawData,
          {
            yamlOutput: this.params.yamlOutput,
            yamlRoundtrip: this.params.yamlRoundtrip,
            yamlOutputGrammarVersion: this.params.yamlOutputGrammarVersion,
            width: this.params.width,
            indentlessLists: this.params.indentlessLists,
            explicitStart: this.params.explicitStart,
            explicitEnd: this.params.explicitEnd,
            compactOutput: this.params.compactOutput,
            rawOutput: this.params.rawOutput,
            slurp: this.params.slurp,
            rawInput: this.params.rawInput,
            sortKeys: this.params.sortKeys,
            argVars: this.params.argVars,
            argJsonVars: this.params.argJsonVars,
          },
          { signal },
        );
      } else {
        return {
          llmContent: 'Error: Either inputFile or rawData must be provided',
          returnDisplay: 'Error: Either inputFile or rawData must be provided',
          error: {
            message: 'Either inputFile or rawData must be provided',
            type: ToolErrorType.YQ_EXECUTION_ERROR,
          },
        };
      }

      // Handle result
      if (!result.success) {
        const errorContent = await this.readErrorFile(result.errorPath);
        return {
          llmContent: `yq processing failed: ${errorContent}`,
          returnDisplay: `Error: ${errorContent}`,
          error: {
            message: `yq processing failed with exit code ${result.exitCode}`,
            type: ToolErrorType.YQ_EXECUTION_ERROR,
          },
        };
      }

      // Success - format result based on output size
      const preview = await executor.getYqPreview(
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
        `[NativeYqTool] Output file size: ${outputSizeStr} (${result.outputSize} bytes)`,
      );
      console.log(`[NativeYqTool] Output path: ${result.outputPath}`);

      let llmContent = '';
      let returnDisplay = '';

      if (result.outputSize <= MAX_INLINE_RESULTS) {
        // Small result - include full content
        llmContent = `Processed YAML with yq filter "${this.params.filter}":\n\n${preview}\n\n📊 Output: ${outputSizeStr} (${result.outputPath})`;
        returnDisplay = `Result:\n${preview}`;
      } else {
        // Large result - show reference and preview
        llmContent = `Processed YAML with yq filter "${this.params.filter}".\n\nFirst ${PREVIEW_LINES} characters:\n${preview}\n\nFull result available at: ${result.outputPath}\n📊 Output file size: ${outputSizeStr}\nTo read the complete result, use the read_file tool with this path.`;
        returnDisplay = `Processed YAML with yq filter "${this.params.filter}" (large output).\n\nFirst ${PREVIEW_LINES} characters:\n${preview}\n\nResult file: ${result.outputPath} (${outputSizeStr})`;
      }

      return {
        llmContent,
        returnDisplay,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        llmContent: `yq processing error: ${message}`,
        returnDisplay: `Error: ${message}`,
        error: {
          message,
          type: ToolErrorType.YQ_EXECUTION_ERROR,
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

function getNativeYqToolDescription(): string {
  return `Native YAML processor using yq with direct-to-disk output handling.

\`\`Advantages over standard approaches:\`\`
- Handles large YAML files efficiently (no memory buffering)
- Suitable for processing large YAML datasets
- Results written directly to disk, LLM receives only summary
- Reduces context usage significantly for large outputs

\`\`Parameters:\`\`
- \`filter\`: yq/jq filter expression to apply to YAML data (required)
- \`inputFile\`: Path to YAML input file (alternative to rawData)
- \`rawData\`: Raw YAML string to process (alternative to inputFile)
- \`yamlOutput\`: Output in YAML format (-y flag)
- \`yamlRoundtrip\`: Preserve YAML tags and styles (-Y flag)
- \`yamlOutputGrammarVersion\`: Grammar version for YAML output (1.1 or 1.2)
- \`width\`: String wrap width for output
- \`indentlessLists\`: Indent block style lists with 0 spaces
- \`explicitStart\`: Always emit explicit document start (---)
- \`explicitEnd\`: Always emit explicit document end (...)
- \`inPlace\`: Edit files in place (-i flag) - CAUTION!
- \`compactOutput\`: Use compact output (-c flag)
- \`rawOutput\`: Output raw strings, not JSON texts (-r flag)
- \`slurp\`: Read input as sequence of JSON texts (-s flag)
- \`rawInput\`: Read input as raw strings, not JSON texts (-R flag)
- \`sortKeys\`: Sort object keys in output (-S flag)
- \`argVars\`: Variables to pass to the yq program (-arg option)
- \`argJsonVars\`: JSON variables to pass to the yq program (-argjson option)

\`\`Results:\`\`
- Small results: Full content included in response
- Large results: Preview shown, full result in file reference

\`\`Examples:\`\`
- Extract specific field: \`{ filter: ".name", inputFile: "/path/to/file.yaml" }\`
- Convert to YAML: \`{ filter: ".", inputFile: "/path/to/file.yaml", yamlOutput: true }\`
- Query nested values: \`{ filter: ".spec.containers[].name", inputFile: "/path/to/file.yaml" }\``;
}

export class NativeYqTool extends BaseDeclarativeTool<
  NativeYqToolParams,
  ToolResult
> {
  static Name: string = ToolNames.YQ;

  constructor(private readonly config: Config) {
    super(
      NativeYqTool.Name,
      ToolDisplayNames.YQ,
      getNativeYqToolDescription(),
      Kind.Execute,
      {
        type: 'object',
        properties: {
          filter: {
            type: 'string',
            description: 'yq/jq filter expression to apply to YAML data',
          },
          inputFile: {
            type: 'string',
            description:
              'Path to YAML input file (provide either inputFile or rawData)',
          },
          rawData: {
            type: 'string',
            description:
              'Raw YAML string to process (provide either inputFile or rawData)',
          },
          yamlOutput: {
            type: 'boolean',
            description: 'Output in YAML format (-y flag)',
          },
          yamlRoundtrip: {
            type: 'boolean',
            description: 'Preserve YAML tags and styles (-Y flag)',
          },
          yamlOutputGrammarVersion: {
            type: 'string',
            enum: ['1.1', '1.2'],
            description: 'Grammar version for YAML output',
          },
          width: {
            type: 'number',
            description: 'String wrap width for output',
          },
          indentlessLists: {
            type: 'boolean',
            description: 'Indent block style lists with 0 spaces',
          },
          explicitStart: {
            type: 'boolean',
            description: 'Always emit explicit document start (---)',
          },
          explicitEnd: {
            type: 'boolean',
            description: 'Always emit explicit document end (...)',
          },
          inPlace: {
            type: 'boolean',
            description: 'Edit files in place (-i flag) - CAUTION!',
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
            description: 'Variables to pass to the yq program',
          },
          argJsonVars: {
            type: 'object',
            additionalProperties: true,
            description: 'JSON variables to pass to the yq program',
          },
        },
        required: ['filter'],
      } as Record<string, unknown>,
      false, // not markdown
      false, // cannot update output
    );
  }

  protected override validateToolParamValues(
    params: NativeYqToolParams,
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

    // Validate inPlace flag - warn about potential danger
    if (params.inPlace && !params.inputFile) {
      return 'inPlace flag can only be used with inputFile parameter';
    }

    return null;
  }

  protected createInvocation(
    params: NativeYqToolParams,
  ): ToolInvocation<NativeYqToolParams, ToolResult> {
    return new NativeYqToolInvocation(this.config, params);
  }
}
