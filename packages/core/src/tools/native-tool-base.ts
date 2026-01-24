/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Native Tool Base Class
 * Reusable base class for native command execution tools
 */

import type { Config } from '../config/config.js';
import type { ToolErrorType } from './tool-error.js';
import type { ToolResult } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation } from './tools.js';
import { readFileViaBash } from '../utils/shell-utils.js';

/**
 * Result from native command execution
 */
export interface NativeCommandResult {
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
 * Base invocation class for native tools
 * Handles common execution patterns for native command tools
 */
export abstract class NativeToolInvocation<
  TParams extends object,
  TResult extends ToolResult,
> extends BaseToolInvocation<TParams, TResult> {
  constructor(
    protected readonly config: Config,
    params: TParams,
  ) {
    super(params);
  }

  abstract override getDescription(): string;

  /**
   * Reads error content from a file using bash cat (lower overhead than fs API)
   * @param filePath Path to error file
   * @returns Error content as string
   */
  protected async readFile(filePath: string): Promise<string> {
    const content = readFileViaBash(filePath);
    return content.trim() || '(empty)';
  }

  /**
   * Helper to check if execution was successful
   */
  protected isSuccess(result: NativeCommandResult): boolean {
    return result.success && result.exitCode === 0;
  }

  /**
   * Create error result from failed execution
   */
  protected createErrorResult(
    message: string,
    errorType: ToolErrorType,
  ): TResult {
    return {
      llmContent: `Error: ${message}`,
      returnDisplay: `Error: ${message}`,
      error: {
        message,
        type: errorType,
      },
    } as TResult;
  }
}

/**
 * Base tool class for native command execution
 * Provides common functionality for tools that execute native commands
 */
export abstract class NativeDeclarativeTool<
  TParams extends object,
  TResult extends ToolResult,
> extends BaseDeclarativeTool<TParams, TResult> {
  constructor(
    protected readonly config: Config,
    name: string,
    displayName: string,
    description: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kind: any,
    parameterSchema: Record<string, unknown>,
  ) {
    super(
      name,
      displayName,
      description,
      kind,
      parameterSchema,
      false, // not markdown
      false, // cannot update output
    );
  }

  /**
   * Validate that command/tool name is provided
   */
  protected validateCommandName(
    commandName: string | null | undefined,
  ): string | null {
    if (!commandName?.trim()) {
      return 'Command name cannot be empty';
    }
    return null;
  }

  /**
   * Validate that path is absolute
   */
  protected validateAbsolutePath(
    path: string,
    paramName: string = 'path',
  ): string | null {
    if (path && !this.isAbsolute(path)) {
      return `${paramName} must be an absolute path`;
    }
    return null;
  }

  /**
   * Check if path is absolute
   */
  protected isAbsolute(path: string): boolean {
    return path.startsWith('/');
  }
}

/**
 * Configuration options for native tool output handling
 */
export interface NativeToolOutputOptions {
  /**
   * Maximum number of results to include inline in response
   */
  maxInlineResults?: number;

  /**
   * Number of lines to show in preview for large results
   */
  previewLines?: number;

  /**
   * Storage directory for native command output
   */
  storageDir?: string;
}

/**
 * Default output options
 */
export const DEFAULT_NATIVE_TOOL_OUTPUT_OPTIONS: NativeToolOutputOptions = {
  maxInlineResults: 100,
  previewLines: 50,
  storageDir: '/var/storage/native',
};

/**
 * Helper function to format result based on size
 * Returns appropriate response based on whether results fit inline or need file reference
 */
export function formatNativeToolOutput(
  fullContent: string,
  itemCount: number,
  options: NativeToolOutputOptions = {},
): {
  llmContent: string;
  returnDisplay: string;
} {
  const opts = { ...DEFAULT_NATIVE_TOOL_OUTPUT_OPTIONS, ...options };
  const maxInline = opts.maxInlineResults ?? 100;
  const preview = opts.previewLines ?? 50;

  if (itemCount <= maxInline) {
    // Small result set - include full content
    return {
      llmContent: fullContent,
      returnDisplay: fullContent,
    };
  }

  // Large result set - show preview and reference
  const lines = fullContent.split('\n');
  const previewContent = lines.slice(0, preview).join('\n');
  const suffix =
    lines.length > preview
      ? `\n... (${lines.length - preview} more items)`
      : '';

  return {
    llmContent: `${previewContent}${suffix}\n\nUse read_file tool to view complete results.`,
    returnDisplay: `${previewContent}${suffix}`,
  };
}
