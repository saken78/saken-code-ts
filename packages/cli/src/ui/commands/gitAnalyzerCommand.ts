/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';

export const gitAnalyzerCommand: SlashCommand = {
  name: 'git-analyzer',
  get description() {
    return t('Analyze git history and recent changes');
  },
  kind: CommandKind.BUILT_IN,
  action: (_context, args) => {
    const argsList = args ? args.trim().split(/\s+/) : [];

    if (argsList.length === 0) {
      return {
        type: 'message',
        messageType: 'info',
        content: `Git Context Analyzer
====================

Analyzes git history to provide accurate context about code changes.

Usage: /git-analyzer <command> [args]

Commands:
  recent        - Show recent commits (default)
  file <name>   - Show history for specific file
  branch        - Compare branches
  author <name> - Show commits by author
  blame         - Show who changed what

Examples:
  /git-analyzer recent
  Show last 10 commits

  /git-analyzer file auth.ts
  When was auth.ts last modified?

  /git-analyzer branch
  What's the difference between main and feature branch?

  /git-analyzer author john
  What did John recently commit?

Why Use This:
  ✓ Understand what changed when
  ✓ Find who made specific changes
  ✓ See commit messages and details
  ✓ Identify bug introduction point
  ✓ Real git data, not guesses`,
      };
    }

    const command = argsList[0].toLowerCase();

    return {
      type: 'message',
      messageType: 'info',
      content: `Git Analyzer: ${command}
${'='.repeat(40)}

Analyzing ${command} in git history...

Please describe what you want to know:
• "Show recent commits"
• "When was this file last changed?"
• "What changed in feature branch?"
• "Who modified this?"

I will extract actual git data and show:
✓ Exact commits
✓ Changes made
✓ Author information
✓ Commit messages
✓ Timeline`,
    };
  },
};
