/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Represents compression summary data
 */
export interface CompressionSummary {
  sessionDate: string;
  tokensSaved: number;
  originalTokens: number;
  newTokens: number;
  workCompleted: string[];
  decisionsMade: string[];
  bugsFound: string[];
  lessonsLearned: string[];
}

/**
 * Service for smart context compression
 * Summarizes conversations and saves to docs
 */
export class CompressionService {
  private docsRoot: string = path.join(process.cwd(), '.docs');

  /**
   * Parse compression result and extract key information
   */
  async parseCompressionResult(
    tokensBefore: number,
    tokensAfter: number,
  ): Promise<CompressionSummary> {
    return {
      sessionDate: new Date().toISOString(),
      tokensSaved: tokensBefore - tokensAfter,
      originalTokens: tokensBefore,
      newTokens: tokensAfter,
      workCompleted: [],
      decisionsMade: [],
      bugsFound: [],
      lessonsLearned: [],
    };
  }

  /**
   * Append to implementation-log.md
   */
  async appendToImplementationLog(summary: CompressionSummary): Promise<void> {
    try {
      const logPath = path.join(
        this.docsRoot,
        '03-logs',
        'implementation-log.md',
      );

      if (!fs.existsSync(logPath)) {
        return;
      }

      const timestamp = new Date().toLocaleString();
      const appendContent = `

## Session: ${timestamp}

**Context Compression:**
- Tokens before: ${summary.originalTokens}
- Tokens after: ${summary.newTokens}
- Tokens saved: ${summary.tokensSaved} (${((summary.tokensSaved / summary.originalTokens) * 100).toFixed(1)}%)

**What was accomplished:**
${summary.workCompleted.map((item) => `- ${item}`).join('\n') || '- (Review chat for details)'}

**Key decisions made:**
${summary.decisionsMade.map((item) => `- ${item}`).join('\n') || '- (See decisions-log.md)'}

**Issues found:**
${summary.bugsFound.map((item) => `- ${item}`).join('\n') || '- None'}

**Lessons learned:**
${summary.lessonsLearned.map((item) => `- ${item}`).join('\n') || '- Review session notes'}
`;

      fs.appendFileSync(logPath, appendContent, 'utf8');
    } catch {
      // Silently fail - don't interrupt compress flow
    }
  }

  /**
   * Generate summary prompt for user to fill in
   */
  getSummarySuggestions(): {
    implementation: string;
    decisions: string;
    bugs: string;
    lessons: string;
  } {
    return {
      implementation:
        'What features/fixes were implemented? (e.g., "Added user authentication", "Fixed timeout bug")',
      decisions:
        'What architectural decisions were made? (e.g., "Use Redis for caching")',
      bugs: 'What bugs were found and how were they fixed? (e.g., "Race condition in async code")',
      lessons:
        'What did you learn? (e.g., "Always validate input at boundaries")',
    };
  }

  /**
   * Check if .docs structure exists
   */
  async docsStructureExists(): Promise<boolean> {
    try {
      const contextPath = path.join(this.docsRoot, '00-context');
      const logsPath = path.join(this.docsRoot, '03-logs');
      return fs.existsSync(contextPath) && fs.existsSync(logsPath);
    } catch {
      return false;
    }
  }

  /**
   * Get compression status message
   */
  getCompressionStatus(tokensBefore: number, tokensAfter: number): string {
    const saved = tokensBefore - tokensAfter;
    const percentage = ((saved / tokensBefore) * 100).toFixed(1);

    return `
📊 Context Compression Complete

**Tokens saved:** ${saved} / ${tokensBefore} (${percentage}%)
**Before:** ${tokensBefore} tokens
**After:** ${tokensAfter} tokens

Summary saved to implementation-log.md automatically.
Remember to update decisions-log.md and bug-log.md with key insights!
`;
  }

  /**
   * Create context refresh prompt
   */
  getContextRefreshPrompt(): string {
    return `
# 🔄 Context Refreshed After Compression

Your conversation history has been compressed to save context space.

The key information is preserved in:
- **implementation-log.md** - What was done
- **decisions-log.md** - Architectural decisions
- **bug-log.md** - Issues found and fixed
- **insights.md** - Lessons learned

When starting your next session:
- Use \`/refresh-memory\` to reload decisions and bugs
- Use \`/progress\` to see what was completed
- Use \`/decisions\` to review architectural choices

Ready to continue working! What's next?
`;
  }
}

/**
 * Singleton instance
 */
let instance: CompressionService | null = null;

export function getCompressionService(): CompressionService {
  if (!instance) {
    instance = new CompressionService();
  }
  return instance;
}
