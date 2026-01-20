/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Interface for mapping deprecated commands to their recommended alternatives
 */
export interface DeprecatedCommandMapping {
  command: string;
  recommendedTool: string;
  reason: string;
}

/**
 * List of deprecated commands and their recommended alternatives
 */
const DEPRECATED_COMMANDS: DeprecatedCommandMapping[] = [
  {
    command: 'ls',
    recommendedTool: 'EZA',
    reason: 'Use enhanced directory listing with EZA tool',
  },
  {
    command: 'grep',
    recommendedTool: 'GREP',
    reason: 'Use enhanced search with GREP tool',
  },
  {
    command: 'fd',
    recommendedTool: 'FD',
    reason: 'Use enhanced file discovery with FD tool',
  },
];

/**
 * Checks if a command is deprecated and returns the mapping if found
 * @param command The command to check
 * @returns The deprecated command mapping if found, null otherwise
 */
export function checkForDeprecatedCommands(
  command: string,
): DeprecatedCommandMapping | null {
  const commandParts = command.trim().split(/\s+/);
  const primaryCommand = commandParts[0].split('/').pop(); // Handle full paths

  return (
    DEPRECATED_COMMANDS.find((item) => item.command === primaryCommand) || null
  );
}

/**
 * Gets the recommended tool for a deprecated command
 * @param command The deprecated command
 * @returns The recommended tool name
 */
export function getRecommendedTool(command: string): string {
  const mapping = DEPRECATED_COMMANDS.find((item) => item.command === command);
  return mapping ? mapping.recommendedTool : 'appropriate tool';
}

/**
 * Checks if a command is in the deprecated list
 * @param command The command to check
 * @param deprecatedList List of deprecated commands to check against
 * @returns True if the command is deprecated, false otherwise
 */
export function isDeprecatedCommand(
  command: string,
  deprecatedList: string[],
): boolean {
  const commandParts = command.trim().split(/\s+/);
  const primaryCommand = commandParts[0].split('/').pop();
  return deprecatedList.includes(primaryCommand || '');
}
