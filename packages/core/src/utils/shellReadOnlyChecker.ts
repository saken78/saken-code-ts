/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { parse } from 'shell-quote';
import {
  detectCommandSubstitution,
  splitCommands,
  stripShellWrapper,
} from './shell-utils.js';

/**
 * Interface for deprecated commands with recommendations
 */
export interface DeprecatedCommandMapping {
  command: string;
  recommendedTool: string;
  reason: string;
}

/**
 * Interface for command optimization warnings
 */
export interface CommandOptimizationWarning {
  type: 'deprecated' | 'suboptimal';
  message: string;
  suggestion: string;
  suggestedTool: string;
}

/**
 * Complete security check result with blocking status and warnings
 */
export interface CommandSecurityCheckResult {
  isReadOnly: boolean;
  blockReason?: string;
  warnings?: CommandOptimizationWarning[];
}

const READ_ONLY_ROOT_COMMANDS = new Set([
  'awk',
  'basename',
  'cat',
  'cd',
  'column',
  'cut',
  'df',
  'dirname',
  'du',
  'echo',
  'env',
  'find',
  'git',
  'grep',
  'head',
  'less',
  'ls',
  'more',
  'printenv',
  'printf',
  'ps',
  'pwd',
  'rg',
  'ripgrep',
  'sed',
  'sort',
  'stat',
  'tail',
  'tree',
  'uniq',
  'wc',
  'which',
  'where',
  'whoami',
]);

const BLOCKED_FIND_FLAGS = new Set([
  '-delete',
  '-exec',
  '-execdir',
  '-ok',
  '-okdir',
]);

const BLOCKED_FIND_PREFIXES = ['-fprint', '-fprintf'];

const READ_ONLY_GIT_SUBCOMMANDS = new Set([
  'blame',
  'branch',
  'cat-file',
  'diff',
  'grep',
  'log',
  'ls-files',
  'remote',
  'rev-parse',
  'show',
  'status',
  'describe',
]);

const BLOCKED_GIT_REMOTE_ACTIONS = new Set([
  'add',
  'remove',
  'rename',
  'set-url',
  'prune',
  'update',
]);

const BLOCKED_GIT_BRANCH_FLAGS = new Set([
  '-d',
  '-D',
  '--delete',
  '--move',
  '-m',
]);

const BLOCKED_SED_PREFIXES = ['-i'];

const ENV_ASSIGNMENT_REGEX = /^[A-Za-z_][A-Za-z0-9_]*=/;

/**
 * Deprecated commands mapping (for warnings only, not blocking)
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
  {
    command: 'du',
    recommendedTool: 'DUST',
    reason: 'Use dust for human-friendly disk usage display',
  },
];

/**
 * Non-optimal command patterns (warnings only, not blocking)
 */
const NON_OPTIMAL_PATTERNS: Array<{
  pattern: RegExp;
  commands: string[];
  suggestedTool: string;
  toolDescription: string;
  reason: string;
}> = [
  {
    pattern: /\bsed\s+/,
    commands: ['sed'],
    suggestedTool: 'EDIT or SMART_EDIT',
    toolDescription: 'edit or smart_edit tool',
    reason:
      'sed (without -i) is error-prone. Use edit/smart_edit tools for safe file modifications.',
  },
  {
    pattern: /\bawk\s+/,
    commands: ['awk'],
    suggestedTool: 'GREP or custom processing',
    toolDescription: 'grep tool or script-based processing',
    reason: 'awk is complex. Use grep for filtering, or write a proper script.',
  },
  {
    pattern: /\becho\s+/,
    commands: ['echo'],
    suggestedTool: 'WRITE_FILE',
    toolDescription: 'write_file tool',
    reason:
      'echo is fragile for text processing. Use write_file tool for safe file writing.',
  },
  {
    pattern: /\bcat\s+/,
    commands: ['cat'],
    suggestedTool: 'BAT',
    toolDescription: 'bat command for syntax highlighting',
    reason: 'cat is limited. Use bat for syntax-highlighted viewing.',
  },
  {
    pattern: /\bfind\s+/,
    commands: ['find'],
    suggestedTool: 'FD',
    toolDescription: 'fd - Fast and user-friendly file finder',
    reason:
      'find is slow and has complex syntax. fd is faster and more intuitive.',
  },
];

function containsWriteRedirection(command: string): boolean {
  let inSingleQuotes = false;
  let inDoubleQuotes = false;
  let escapeNext = false;

  for (const char of command) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && !inSingleQuotes) {
      escapeNext = true;
      continue;
    }

    if (char === "'" && !inDoubleQuotes) {
      inSingleQuotes = !inSingleQuotes;
      continue;
    }

    if (char === '"' && !inSingleQuotes) {
      inDoubleQuotes = !inDoubleQuotes;
      continue;
    }

    if (!inSingleQuotes && !inDoubleQuotes && char === '>') {
      return true;
    }
  }

  return false;
}

function normalizeTokens(segment: string): string[] {
  const parsed = parse(segment);
  const tokens: string[] = [];
  for (const token of parsed) {
    if (typeof token === 'string') {
      tokens.push(token);
    }
  }
  return tokens;
}

function skipEnvironmentAssignments(tokens: string[]): {
  root?: string;
  args: string[];
} {
  let index = 0;
  while (index < tokens.length && ENV_ASSIGNMENT_REGEX.test(tokens[index]!)) {
    index++;
  }

  if (index >= tokens.length) {
    return { args: [] };
  }

  return {
    root: tokens[index],
    args: tokens.slice(index + 1),
  };
}

function evaluateFindCommand(tokens: string[]): boolean {
  const [, ...rest] = tokens;
  for (const token of rest) {
    const lower = token.toLowerCase();
    if (BLOCKED_FIND_FLAGS.has(lower)) {
      return false;
    }
    if (BLOCKED_FIND_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
      return false;
    }
  }
  return true;
}

function evaluateSedCommand(tokens: string[]): boolean {
  const [, ...rest] = tokens;
  for (const token of rest) {
    if (
      BLOCKED_SED_PREFIXES.some((prefix) => token.startsWith(prefix)) ||
      token === '--in-place'
    ) {
      return false;
    }
  }
  return true;
}

function evaluateGitRemoteArgs(args: string[]): boolean {
  for (const arg of args) {
    if (BLOCKED_GIT_REMOTE_ACTIONS.has(arg.toLowerCase())) {
      return false;
    }
  }
  return true;
}

function evaluateGitBranchArgs(args: string[]): boolean {
  for (const arg of args) {
    if (BLOCKED_GIT_BRANCH_FLAGS.has(arg)) {
      return false;
    }
  }
  return true;
}

function evaluateGitCommand(tokens: string[]): boolean {
  let index = 1;
  while (index < tokens.length && tokens[index]!.startsWith('-')) {
    const flag = tokens[index]!.toLowerCase();
    if (flag === '--version' || flag === '--help') {
      return true;
    }
    index++;
  }

  if (index >= tokens.length) {
    return true;
  }

  const subcommand = tokens[index]!.toLowerCase();
  if (!READ_ONLY_GIT_SUBCOMMANDS.has(subcommand)) {
    return false;
  }

  const args = tokens.slice(index + 1);

  if (subcommand === 'remote') {
    return evaluateGitRemoteArgs(args);
  }

  if (subcommand === 'branch') {
    return evaluateGitBranchArgs(args);
  }

  return true;
}

/**
 * Check if a command is deprecated and return the mapping
 */
function checkForDeprecatedCommand(
  command: string,
): DeprecatedCommandMapping | null {
  const commandParts = command.trim().split(/\s+/);
  const primaryCommand = commandParts[0]?.split('/').pop();

  return (
    DEPRECATED_COMMANDS.find((item) => item.command === primaryCommand) || null
  );
}

/**
 * Generate optimization warnings for a command
 */
function getOptimizationWarnings(
  command: string,
  rootCommand: string,
): CommandOptimizationWarning[] {
  const warnings: CommandOptimizationWarning[] = [];

  // Check for deprecated command
  const deprecatedMapping = checkForDeprecatedCommand(rootCommand);
  if (deprecatedMapping) {
    warnings.push({
      type: 'deprecated',
      message: `Command '${rootCommand}' is available but consider using '${deprecatedMapping.recommendedTool}'`,
      suggestion: `Use '${deprecatedMapping.recommendedTool}' tool instead`,
      suggestedTool: deprecatedMapping.recommendedTool,
    });
  }

  // Check for non-optimal patterns
  for (const pattern of NON_OPTIMAL_PATTERNS) {
    if (pattern.pattern.test(command)) {
      // Skip if already reported as deprecated
      if (deprecatedMapping) continue;

      warnings.push({
        type: 'suboptimal',
        message: `Command pattern '${pattern.commands[0]}' detected - consider using a better tool`,
        suggestion: `Use '${pattern.suggestedTool}' (${pattern.toolDescription})\nReason: ${pattern.reason}`,
        suggestedTool: pattern.suggestedTool,
      });
      break;
    }
  }

  return warnings;
}

function evaluateShellSegment(segment: string): {
  isReadOnly: boolean;
  blockReason?: string;
  warnings?: CommandOptimizationWarning[];
} {
  if (!segment.trim()) {
    return { isReadOnly: true };
  }

  const stripped = stripShellWrapper(segment);
  if (!stripped) {
    return { isReadOnly: true };
  }

  if (detectCommandSubstitution(stripped)) {
    return {
      isReadOnly: false,
      blockReason:
        'Command substitution using $(), `` ` ``, <(), or >() is not allowed for security reasons',
    };
  }

  if (containsWriteRedirection(stripped)) {
    return {
      isReadOnly: false,
      blockReason:
        'Write redirection (>, >>) is not allowed for security reasons',
    };
  }

  const tokens = normalizeTokens(stripped);
  if (tokens.length === 0) {
    return { isReadOnly: true };
  }

  const { root, args } = skipEnvironmentAssignments(tokens);
  if (!root) {
    return { isReadOnly: true };
  }

  const normalizedRoot = root.toLowerCase();
  if (!READ_ONLY_ROOT_COMMANDS.has(normalizedRoot)) {
    return {
      isReadOnly: false,
      blockReason: `Command '${normalizedRoot}' is not in the allowed read-only command list`,
    };
  }

  // Check command-specific security rules
  let isAllowed = true;
  if (normalizedRoot === 'find') {
    isAllowed = evaluateFindCommand([normalizedRoot, ...args]);
  } else if (normalizedRoot === 'sed') {
    isAllowed = evaluateSedCommand([normalizedRoot, ...args]);
  } else if (normalizedRoot === 'git') {
    isAllowed = evaluateGitCommand([normalizedRoot, ...args]);
  }

  if (!isAllowed) {
    return {
      isReadOnly: false,
      blockReason: `Command '${normalizedRoot}' contains dangerous flags or operations`,
    };
  }

  // Generate optimization warnings (non-blocking)
  const warnings = getOptimizationWarnings(stripped, normalizedRoot);

  return {
    isReadOnly: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Comprehensive shell command security check with warnings
 * Returns detailed result including security status and optimization warnings
 */
export function checkShellCommandSecurity(
  command: string,
): CommandSecurityCheckResult {
  if (typeof command !== 'string' || !command.trim()) {
    return {
      isReadOnly: false,
      blockReason: 'Invalid command: empty or not a string',
    };
  }

  const segments = splitCommands(command);
  const allWarnings: CommandOptimizationWarning[] = [];

  for (const segment of segments) {
    const result = evaluateShellSegment(segment);
    if (!result.isReadOnly) {
      return {
        isReadOnly: false,
        blockReason: result.blockReason,
      };
    }
    if (result.warnings) {
      allWarnings.push(...result.warnings);
    }
  }

  return {
    isReadOnly: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
}

/**
 * Legacy function for backward compatibility
 * Returns true if command is read-only (ignores warnings)
 */
export function isShellCommandReadOnly(command: string): boolean {
  const result = checkShellCommandSecurity(command);
  return result.isReadOnly;
}

/**
 * Public functions for deprecated command validation (for compatibility)
 */
export function checkForDeprecatedCommands(
  command: string,
): DeprecatedCommandMapping | null {
  return checkForDeprecatedCommand(command);
}

export function getRecommendedTool(command: string): string {
  const mapping = checkForDeprecatedCommand(command);
  return mapping ? mapping.recommendedTool : 'appropriate tool';
}

/**
 * Get optimization guide for all patterns
 */
export function getCommandOptimizationGuide(): string {
  const commands = Array.from(
    new Set(NON_OPTIMAL_PATTERNS.flatMap((p) => p.commands)),
  );
  const guide = commands
    .map((cmd) => {
      const pattern = NON_OPTIMAL_PATTERNS.find((p) =>
        p.commands.includes(cmd),
      );
      if (!pattern) return '';

      return `${cmd} → ${pattern.suggestedTool}
   Tool: ${pattern.toolDescription}
   Reason: ${pattern.reason}`;
    })
    .filter(Boolean)
    .join('\n\n');

  return `
🚫 COMMAND OPTIMIZATION SUGGESTIONS

These commands are allowed but consider using better alternatives:

${guide}

Modern CLI tool alternatives (pre-installed):
- File listing: eza (instead of ls)
- File viewing: bat (instead of cat)
- File finding: fd (instead of find)
- Text search: rg/grep (instead of grep)
- File modification: edit/smart_edit (instead of sed)
- File writing: write_file (instead of echo >)
- Disk usage: dust (instead of du)
`;
}
