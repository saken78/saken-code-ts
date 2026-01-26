/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Strict command enforcement validator
 * Blocks non-optimal command patterns and suggests proper tools
 */

export interface CommandValidationResult {
  isValid: boolean;
  error?: {
    message: string;
    suggestion: string;
    suggestedTool: string;
  };
}

/**
 * Non-optimal command patterns mapping to suggested tools
 */
const NON_OPTIMAL_PATTERNS: Array<{
  pattern: RegExp;
  commands: string[];
  suggestedTool: string;
  toolDescription: string;
  reason: string;
}> = [
  // {
  //   pattern: /\bfind\s+/,
  //   commands: ['find'],
  //   suggestedTool: 'FD',
  //   toolDescription: 'fd - Fast and user-friendly file finder',
  //   reason:
  //     'find is slow and has complex syntax. fd is faster and more intuitive.',
  // },
  // {
  //   pattern: /\bgrep\s+/,
  //   commands: ['grep'],
  //   suggestedTool: 'rg',
  //   toolDescription: 'rg - Fast content search tool',
  //   reason: 'use bash rg or rg tool <USE BASH RG> </USE>',
  // },
  // {
  //   pattern: /\bcat\s+/,
  //   commands: ['cat'],
  //   suggestedTool: 'BAT',
  //   toolDescription: 'bat command',
  //   reason:
  //     'cat is limited. Use read_file tool for file viewing, or bat for syntax highlighting.',
  // },
  // {
  //   pattern: /\b(head|tail)\s+/,
  //   commands: ['head', 'tail'],
  //   suggestedTool: 'READ_FILE',
  //   toolDescription: 'read_file tool with line-based reading',
  //   reason:
  //     'head/tail are limited. Use read_file tool for intelligent file reading with getFileReadingStrategy().',
  // },
  {
    pattern: /\bsed\s+/,
    commands: ['sed'],
    suggestedTool: 'EDIT or SMART_EDIT',
    toolDescription: 'edit or smart_edit tool',
    reason:
      'sed is error-prone for modifications. Use edit/smart_edit tools for safe file modifications.',
  },
  {
    pattern: /\bawk\s+/,
    commands: ['awk'],
    suggestedTool: 'GREP or custom processing',
    toolDescription: 'grep tool or script-based processing',
    reason: 'awk is complex. Use grep for filtering, or write a proper script.',
  },
  {
    pattern: /\becho\s+.*>|>>/,
    commands: ['echo'],
    suggestedTool: 'WRITE_FILE',
    toolDescription: 'write_file tool',
    reason:
      'echo with redirection is fragile. Use write_file tool for safe file writing.',
  },
  {
    pattern: /\bls\s+/,
    commands: ['ls'],
    suggestedTool: 'EZA',
    toolDescription: 'eza - Enhanced directory listing',
    reason: 'ls is outdated. eza provides better formatting and performance.',
  },
  {
    pattern: /\bdu\s+/,
    commands: ['du'],
    suggestedTool: 'DUST or custom',
    toolDescription: 'dust command or similar',
    reason: 'du is hard to read. dust provides human-friendly output.',
  },
];

/**
 * Validates command for non-optimal patterns
 * Implements STRICT ENFORCEMENT - blocks problematic patterns
 *
 * @param command The command to validate
 * @returns Validation result with error and suggestion if command is non-optimal
 */
export function validateCommandOptimality(
  command: string,
): CommandValidationResult {
  // Normalize command for matching
  const normalizedCommand = command.trim();

  // Check each non-optimal pattern
  for (const pattern of NON_OPTIMAL_PATTERNS) {
    if (pattern.pattern.test(normalizedCommand)) {
      const suggestion = generateSmartSuggestion(normalizedCommand, pattern);

      return {
        isValid: false,
        error: {
          message: `❌ Non-optimal command detected: "${pattern.commands[0]}" is not the best choice here.`,
          suggestion,
          suggestedTool: pattern.suggestedTool,
        },
      };
    }
  }

  return { isValid: true };
}

/**
 * Smart suggestion generator based on command intent
 * Analyzes the command and generates contextual suggestions
 *
 * @param command The command being executed
 * @param pattern The matched non-optimal pattern
 * @returns Smart suggestion string
 */
function generateSmartSuggestion(
  command: string,
  pattern: {
    suggestedTool: string;
    toolDescription: string;
    reason: string;
    commands: string[];
  },
): string {
  const cmdName = pattern.commands[0];

  // Detect specific use cases and generate context-aware suggestions
  if (cmdName === 'find') {
    if (command.includes('-name')) {
      return `Use 'fd' tool: fd pattern /path\nExample: fd "*.ts" src/\nReason: ${pattern.reason}`;
    }
    if (command.includes('-type f')) {
      return `Use 'fd' tool with type filter: fd --type f pattern\nReason: ${pattern.reason}`;
    }
    return `Use '${pattern.suggestedTool}' tool (${pattern.toolDescription})\nReason: ${pattern.reason}`;
  }

  if (cmdName === 'grep') {
    if (command.includes('-r')) {
      return `Use 'grep' tool with recursion: grep -r pattern /path\nOr use 'rg' for better performance\nReason: ${pattern.reason}`;
    }
    return `Use '${pattern.suggestedTool}' tool (${pattern.toolDescription})\nReason: ${pattern.reason}`;
  }

  if (cmdName === 'cat') {
    if (command.match(/cat\s+\S+\s*\|/)) {
      return `Use 'read_file' tool to read file, then pipe output if needed\nOr use 'bat' for syntax-highlighted viewing\nReason: ${pattern.reason}`;
    }
    return `Use 'read_file' tool or 'bat' command\nread_file intelligently handles large files (>500 lines)\nReason: ${pattern.reason}`;
  }

  if (cmdName === 'sed' || cmdName === 'awk') {
    return `Use 'edit' or 'smart_edit' tool instead\nThese tools are safer and have better error handling\nReason: ${pattern.reason}`;
  }

  if (cmdName === 'echo' && command.includes('>')) {
    return `Use 'write_file' tool instead\nwrite_file tool handles encoding, permissions, and safety\nReason: ${pattern.reason}`;
  }

  if (cmdName === 'ls') {
    return `Use 'eza' command: eza -la /path\nOr use native file discovery tools\nReason: ${pattern.reason}`;
  }

  // Default suggestion
  return `Use '${pattern.suggestedTool}' tool (${pattern.toolDescription})\nReason: ${pattern.reason}`;
}

/**
 * Get all non-optimal commands list
 * Useful for documentation and LLM context
 *
 * @returns Array of non-optimal command names
 */
export function getNonOptimalCommands(): string[] {
  return Array.from(new Set(NON_OPTIMAL_PATTERNS.flatMap((p) => p.commands)));
}

/**
 * Get comprehensive guide for command optimization
 * Returns formatted string with all recommendations
 *
 * @returns Formatted guide string
 */
export function getCommandOptimizationGuide(): string {
  const commands = getNonOptimalCommands();
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
🚫 NON-OPTIMAL COMMANDS - STRICT ENFORCEMENT ENABLED

These commands are blocked because they're not optimal.
Use the suggested tools instead:

${guide}

Modern CLI tool alternatives (pre-installed):
- File listing: eza (instead of ls)
- File viewing: bat (instead of cat)
- File finding: fd (instead of find)
- Text search: rg/grep (instead of grep)
- File modification: edit/smart_edit (instead of sed/awk)
- File writing: write_file (instead of echo >)
- Directory jumping: zoxide (instead of cd)
- Disk usage: dust (instead of du)
`;
}
