/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import fs from 'node:fs';
import { makeRelative, shortenPath } from '../utils/paths.js';
import type { ToolInvocation, ToolLocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';

import type { PartUnion } from '@google/genai';
import {
  processSingleFileContent,
  getSpecificMimeType,
} from '../utils/fileUtils.js';
import type { Config } from '../config/config.js';
import { FileOperation } from '../telemetry/metrics.js';
import { getProgrammingLanguage } from '../telemetry/telemetry-utils.js';
import { logFileOperation } from '../telemetry/loggers.js';
import { FileOperationEvent } from '../telemetry/types.js';
// import { isSubpath } from '../utils/paths.js';
import { fileAccessValidator } from './file-access-validation.js';

/**
 * Parameters for the ReadFile tool
 */
export interface ReadFileToolParams {
  /**
   * The absolute path to the file to read
   */
  absolute_path: string;

  /**
   * The line number to start reading from (optional)
   */
  offset?: number;

  /**
   * The number of lines to read (optional)
   */
  limit?: number;
}

class ReadFileToolInvocation extends BaseToolInvocation<
  ReadFileToolParams,
  ToolResult
> {
  constructor(
    private config: Config,
    params: ReadFileToolParams,
  ) {
    super(params);
  }

  getDescription(): string {
    const relativePath = makeRelative(
      this.params.absolute_path,
      this.config.getTargetDir(),
    );
    const shortPath = shortenPath(relativePath);

    const { offset, limit } = this.params;
    if (offset !== undefined && limit !== undefined) {
      return `${shortPath} (lines ${offset + 1}-${offset + limit})`;
    } else if (offset !== undefined) {
      return `${shortPath} (from line ${offset + 1})`;
    } else if (limit !== undefined) {
      return `${shortPath} (first ${limit} lines)`;
    }

    return shortPath;
  }

  override toolLocations(): ToolLocation[] {
    return [{ path: this.params.absolute_path, line: this.params.offset }];
  }

  async execute(): Promise<ToolResult> {
    const result = await processSingleFileContent(
      this.params.absolute_path,
      this.config,
      this.params.offset,
      this.params.limit,
    );

    if (result.error) {
      return {
        llmContent: result.llmContent,
        returnDisplay: result.returnDisplay || 'Error reading file',
        error: {
          message: result.error,
          type: result.errorType,
        },
      };
    }

    // Catat bahwa file telah diakses
    fileAccessValidator.recordFileAccess(this.params.absolute_path);

    // Get total line count for validation and logging
    const totalLines = result.originalLineCount || 0;
    const linesRead = result.linesShown
      ? result.linesShown[1] - result.linesShown[0] + 1
      : totalLines;
    const startLine = result.linesShown ? result.linesShown[0] : 0;
    const endLine = result.linesShown ? result.linesShown[1] : totalLines - 1;

    // Log with format: *{FILENAME} {LINES_READ}/{TOTAL_LINES}
    const relativePathForLogging = makeRelative(
      this.params.absolute_path,
      this.config.getTargetDir(),
    );
    const logMessage = `*${relativePathForLogging} ${linesRead}/${totalLines}`;
    console.log(logMessage);

    // Validate that for important files, we're reading enough context
    // If file is truncated, add a validation note
    const validationNote = this.getValidationNote(
      totalLines,
      startLine,
      endLine,
    );

    let llmContent: PartUnion;
    if (result.isTruncated) {
      const [start, end] = result.linesShown!;
      const total = result.originalLineCount!;
      const truncationWarning =
        `⚠️  File truncated: showing lines ${start + 1}-${end + 1} of ${total} total lines.\n` +
        `To see full file context, use: read_file(absolute_path="${this.params.absolute_path}")\n` +
        `${validationNote ? `\n${validationNote}\n` : ''}\n---\n\n`;
      llmContent = truncationWarning + (result.llmContent || '');
    } else {
      llmContent = result.llmContent || '';
      if (validationNote) {
        llmContent = `${validationNote}\n\n${llmContent}`;
      }
    }

    const lines =
      typeof result.llmContent === 'string'
        ? result.llmContent.split('\n').length
        : undefined;
    const mimetype = getSpecificMimeType(this.params.absolute_path);
    const programming_language = getProgrammingLanguage({
      absolute_path: this.params.absolute_path,
    });
    logFileOperation(
      this.config,
      new FileOperationEvent(
        ReadFileTool.Name,
        FileOperation.READ,
        lines,
        mimetype,
        path.extname(this.params.absolute_path),
        programming_language,
      ),
    );

    // Trigger LSP operations on the file to enhance understanding
    // Try to get symbols synchronously for LLM context
    let symbolsInfo = '';
    try {
      const lspSymbols = await this.getLspSymbolsForContext();
      if (lspSymbols) {
        symbolsInfo = lspSymbols;
      }
    } catch (error) {
      console.debug('[LSP] Failed to get symbols for context:', error);
      // Silently fail - symbols are optional enhancement
    }

    // Append symbols info to llmContent if available
    if (symbolsInfo) {
      if (typeof llmContent === 'string') {
        llmContent = `${llmContent}\n\n${symbolsInfo}`;
      }
    }

    return {
      llmContent,
      returnDisplay: logMessage || '',
    };
  }

  /**
   * Get LSP symbols for the file and format as context for LLM
   * This provides structural information about the file
   */
  private async getLspSymbolsForContext(): Promise<string> {
    try {
      const lspClient = this.config.getLspClient?.();
      if (!lspClient) {
        return '';
      }

      const filePath = this.params.absolute_path;
      const isSourceFile = ['.ts', '.tsx', '.js', '.jsx'].includes(
        path.extname(filePath).toLowerCase(),
      );

      if (!isSourceFile || !fs.existsSync(filePath)) {
        return '';
      }

      // Convert path to file:// URI for LSP
      let fileUri = `file://${filePath}`;
      if (process.platform === 'win32') {
        fileUri = `file:///${filePath.replace(/\\/g, '/')}`;
      }

      // Get document symbols
      const symbols = await lspClient.documentSymbols(fileUri);
      if (!symbols || symbols.length === 0) {
        return '';
      }

      // Format symbols for LLM
      const symbolsByType = new Map<string, typeof symbols>();
      for (const symbol of symbols) {
        const kind = symbol.kind || 'Unknown';
        if (!symbolsByType.has(kind)) {
          symbolsByType.set(kind, []);
        }
        symbolsByType.get(kind)!.push(symbol);
      }

      // Build formatted output
      let output = '\n## File Structure (LSP Symbols)\n\n';

      // Group by kind for readability
      const groupOrder = [
        'Class',
        'Interface',
        'Type',
        'Function',
        'Constant',
        'Variable',
        'Property',
        'Method',
        'Enum',
        'Module',
      ];
      for (const kind of groupOrder) {
        const items = symbolsByType.get(kind);
        if (items) {
          output += `### ${kind}s (${items.length})\n`;
          for (const item of items.slice(0, 10)) {
            // Limit to 10 items per type
            output +=
              `- \`${item.name}\`` +
              (item.containerName ? ` (in ${item.containerName})` : '') +
              '\n';
          }
          if (items.length > 10) {
            output += `- ... and ${items.length - 10} more\n`;
          }
          output += '\n';
        }
      }

      // Add any remaining types
      for (const [kind, items] of symbolsByType.entries()) {
        if (!groupOrder.includes(kind)) {
          output += `### ${kind}s (${items.length})\n`;
          for (const item of items.slice(0, 5)) {
            output += `- \`${item.name}\`\n`;
          }
          if (items.length > 5) {
            output += `- ... and ${items.length - 5} more\n`;
          }
          output += '\n';
        }
      }

      output += `**Total symbols found: ${symbols.length}**\n`;
      return output;
    } catch (error) {
      console.debug(
        '[LSP] Error getting symbols for context:',
        error instanceof Error ? error.message : error,
      );
      return '';
    }
  }

  /**
   * Get validation note for LLM about reading full file context
   */
  private getValidationNote(
    totalLines: number,
    startLine: number,
    endLine: number,
  ): string {
    const isSourceFile = [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.py',
      '.java',
      '.go',
      '.rs',
      '.cpp',
    ].includes(path.extname(this.params.absolute_path).toLowerCase());

    if (!isSourceFile || totalLines <= 20) {
      return '';
    }

    // If we're only reading a small portion of a large file
    const readPercentage = ((endLine - startLine + 1) / totalLines) * 100;
    if (readPercentage < 30) {
      return (
        `📝 Note: Reading only ${Math.round(readPercentage)}% of this file (${totalLines} lines total). ` +
        `Consider reading the full file for better context understanding, especially for imports, type definitions, and dependencies.`
      );
    }

    return '';
  }
}

/**
 * Implementation of the ReadFile tool logic
 */
export class ReadFileTool extends BaseDeclarativeTool<
  ReadFileToolParams,
  ToolResult
> {
  static readonly Name: string = ToolNames.READ_FILE;

  constructor(private config: Config) {
    super(
      ReadFileTool.Name,
      ToolDisplayNames.READ_FILE,
      `Reads and returns the content of a specified file. If the file is large, the content will be truncated. The tool's response will clearly indicate if truncation has occurred and will provide details on how to read more of the file using the 'offset' and 'limit' parameters. Handles text, images (PNG, JPG, GIF, WEBP, SVG, BMP), and PDF files. For text files, it can read specific line ranges.`,
      Kind.Read,
      {
        properties: {
          absolute_path: {
            description:
              "The absolute path to the file to read (e.g., '/home/user/project/file.txt'). Relative paths are not supported. You must provide an absolute path.",
            type: 'string',
          },
          offset: {
            description:
              "Optional: For text files, the 0-based line number to start reading from. Requires 'limit' to be set. Use for paginating through large files.",
            type: 'number',
          },
          limit: {
            description:
              "Optional: For text files, maximum number of lines to read. Use with 'offset' to paginate through large files. If omitted, reads the entire file (if feasible, up to a default limit).",
            type: 'number',
          },
        },
        required: ['absolute_path'],
        type: 'object',
      },
    );
  }

  protected override validateToolParamValues(
    params: ReadFileToolParams,
  ): string | null {
    const filePath = params.absolute_path;
    if (params.absolute_path.trim() === '') {
      return "The 'absolute_path' parameter must be non-empty.";
    }

    if (!path.isAbsolute(filePath)) {
      return `File path must be absolute, but was relative: ${filePath}. You must provide an absolute path.`;
    }

    // const workspaceContext = this.config.getWorkspaceContext();
    // const projectTempDir = this.config.storage.getProjectTempDir();
    // const userSkillsDir = this.config.storage.getUserSkillsDir();
    // const resolvedFilePath = path.resolve(filePath);
    // const isWithinTempDir = isSubpath(projectTempDir, resolvedFilePath);
    // const isWithinUserSkills = isSubpath(userSkillsDir, resolvedFilePath);

    // if (
    //   !workspaceContext.isPathWithinWorkspace(filePath) &&
    //   !isWithinTempDir &&
    //   !isWithinUserSkills
    // ) {
    //   const directories = workspaceContext.getDirectories();
    //   return `File path must be within one of the workspace directories: ${directories.join(
    //     ', ',
    //   )} or within the project temp directory: ${projectTempDir}`;
    // }
    if (params.offset !== undefined && params.offset < 0) {
      return 'Offset must be a non-negative number';
    }
    if (params.limit !== undefined && params.limit <= 0) {
      return 'Limit must be a positive number';
    }

    const fileService = this.config.getFileService();
    if (fileService.shouldQwenIgnoreFile(params.absolute_path)) {
      return `File path '${filePath}' is ignored by .qwenignore pattern(s).`;
    }

    return null;
  }

  protected createInvocation(
    params: ReadFileToolParams,
  ): ToolInvocation<ReadFileToolParams, ToolResult> {
    return new ReadFileToolInvocation(this.config, params);
  }
}
