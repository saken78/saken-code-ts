/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import stripAnsi from 'strip-ansi';
import { getCommandRoots } from './shell-utils.js';
import { formatMemoryUsage } from './formatters.js';

export interface CommandStatistics {
  lines: number;
  size: number;
  executionTime: number;
  matches?: number;
  files?: number;
  pattern?: string;
}

export interface ParsedOutput {
  cleanOutput: string;
  statistics: CommandStatistics;
}

/**
 * Counts lines in output, handling ANSI codes and empty strings
 */
function countLines(output: string): number {
  if (!output || output.trim().length === 0) return 0;
  const cleanOutput = stripAnsi(output);
  return cleanOutput.split('\n').length;
}

/**
 * Calculates output size in bytes (clean, without ANSI codes)
 */
function calculateSize(output: string): number {
  if (!output) return 0;
  const cleanOutput = stripAnsi(output);
  return Buffer.byteLength(cleanOutput, 'utf8');
}

/**
 * Parses grep/rg output to extract match count and file count
 * Handles various grep/rg output formats:
 * - Standard: filename:line:content
 * - With line numbers: filename:123:content
 * - Count mode: filename:count
 */
function parseGrepOutput(output: string): { matches: number; files: number } {
  if (!output || output.trim().length === 0) {
    return { matches: 0, files: 0 };
  }

  const cleanOutput = stripAnsi(output);
  const lines = cleanOutput
    .split('\n')
    .filter((line) => line.trim().length > 0);

  const filesSet = new Set<string>();
  let matchCount = 0;

  for (const line of lines) {
    // Match pattern: filename:linenum:content or filename:content
    const match = line.match(/^([^:]+):/);
    if (match) {
      filesSet.add(match[1]);
      matchCount++;
    }
  }

  return {
    matches: matchCount,
    files: filesSet.size,
  };
}

/**
 * Parses fd output to extract file count
 * fd outputs one file per line
 */
function parseFdOutput(output: string): { files: number } {
  if (!output || output.trim().length === 0) {
    return { files: 0 };
  }

  const cleanOutput = stripAnsi(output);
  const lines = cleanOutput
    .split('\n')
    .filter((line) => line.trim().length > 0);

  return { files: lines.length };
}

/**
 * Extracts search pattern from command
 * Handles: grep "pattern", rg 'pattern', fd pattern
 */
function extractPattern(command: string): string | undefined {
  // Match quoted patterns: "pattern" or 'pattern'
  const quotedMatch = command.match(/["']([^"']+)["']/);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  // For fd and simple grep/rg without quotes
  // Extract first argument after command and flags
  const commandRoots = getCommandRoots(command);
  if (commandRoots.length === 0) return undefined;

  const commandRoot = commandRoots[0];
  const commandPattern = new RegExp(
    `\\b${commandRoot}\\b\\s+(?:-\\w+\\s+)*([^\\s-][^\\s]*)`,
  );
  const match = command.match(commandPattern);

  return match ? match[1] : undefined;
}

/**
 * Generates statistics for command execution
 *
 * @param command The command that was executed
 * @param output The command output (may contain ANSI codes)
 * @param executionTimeMs Execution time in milliseconds
 * @param isBinary Whether the output was detected as binary
 * @param wasAborted Whether the command was aborted/timed out
 * @returns Parsed output with statistics
 */
export function generateStatistics(
  command: string,
  output: string,
  executionTimeMs: number,
  isBinary: boolean = false,
  wasAborted: boolean = false,
): ParsedOutput {
  const cleanOutput = stripAnsi(output);

  const baseStats: CommandStatistics = {
    lines: countLines(output),
    size: calculateSize(output),
    executionTime: executionTimeMs,
  };

  // Don't add command-specific stats for binary output or aborted commands
  if (isBinary || wasAborted) {
    return {
      cleanOutput,
      statistics: baseStats,
    };
  }

  // Detect command type
  const commandRoots = getCommandRoots(command);
  if (commandRoots.length === 0) {
    return { cleanOutput, statistics: baseStats };
  }

  const commandRoot = commandRoots[0];
  const pattern = extractPattern(command);

  // Add command-specific statistics
  if (commandRoot === 'grep' || commandRoot === 'rg') {
    const { matches, files } = parseGrepOutput(output);
    return {
      cleanOutput,
      statistics: {
        ...baseStats,
        matches,
        files,
        pattern,
      },
    };
  } else if (commandRoot === 'fd') {
    const { files } = parseFdOutput(output);
    return {
      cleanOutput,
      statistics: {
        ...baseStats,
        files,
        pattern,
      },
    };
  }

  return { cleanOutput, statistics: baseStats };
}

/**
 * Formats statistics as a footer string
 *
 * @param stats Command statistics
 * @param isPartial Whether these are partial statistics (error occurred)
 * @returns Formatted statistics string
 */
export function formatStatisticsFooter(
  stats: CommandStatistics,
  isPartial: boolean = false,
): string {
  const partialPrefix = isPartial ? '[Partial] ' : '';

  // Base statistics (always shown)
  const baseStats = `${partialPrefix}Lines: ${stats.lines}, Size: ${formatMemoryUsage(stats.size)}, Time: ${stats.executionTime}ms`;

  // Add command-specific statistics if available
  const commandSpecific: string[] = [];

  if (stats.matches !== undefined) {
    commandSpecific.push(`Matches: ${stats.matches}`);
  }

  if (stats.files !== undefined) {
    commandSpecific.push(`Files: ${stats.files}`);
  }

  if (stats.pattern) {
    // Truncate long patterns
    const displayPattern =
      stats.pattern.length > 50
        ? stats.pattern.substring(0, 47) + '...'
        : stats.pattern;
    commandSpecific.push(`Pattern: ${displayPattern}`);
  }

  if (commandSpecific.length > 0) {
    return `${baseStats}, ${commandSpecific.join(', ')}`;
  }

  return baseStats;
}
