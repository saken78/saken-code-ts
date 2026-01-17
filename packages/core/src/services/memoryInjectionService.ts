/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDocumentLoaderService } from './documentLoaderService.js';

/**
 * Represents memory context from loaded logs
 */
export interface MemoryContext {
  recentDecisions: string;
  knownBugs: string;
  insights: string;
  hasDecisions: boolean;
  hasBugs: boolean;
  hasInsights: boolean;
}

/**
 * Service for managing memory injection from logs
 * Enables consistent decision-making across sessions
 */
export class MemoryInjectionService {
  private loaderService = getDocumentLoaderService();
  private cachedMemory: MemoryContext | null = null;
  private lastCacheTime: number = 0;
  private cacheTimeout: number = 60000; // 1 minute

  /**
   * Load memory context from logs
   */
  async loadMemoryContext(): Promise<MemoryContext> {
    // Check cache
    if (
      this.cachedMemory &&
      Date.now() - this.lastCacheTime < this.cacheTimeout
    ) {
      return this.cachedMemory;
    }

    // Load decisions, bugs, and insights
    const decisionsContent = await this.loaderService.loadDecisionsContext();
    const bugsContent = await this.loaderService.loadBugsContext();
    const insightsContent = await this.loaderService.loadInsightsContext();

    const memory: MemoryContext = {
      recentDecisions: decisionsContent,
      knownBugs: bugsContent,
      insights: insightsContent,
      hasDecisions: !decisionsContent.includes('⚠️'),
      hasBugs: !bugsContent.includes('⚠️'),
      hasInsights: !insightsContent.includes('⚠️'),
    };

    // Cache result
    this.cachedMemory = memory;
    this.lastCacheTime = Date.now();

    return memory;
  }

  /**
   * Get formatted memory string for system injection
   */
  async getMemoryInjectionPrompt(): Promise<string> {
    const memory = await this.loadMemoryContext();
    const parts: string[] = [];

    parts.push('# 💾 Project Memory Context\n');
    parts.push(
      "The following is the project's collective memory. Reference it when making decisions.\n",
    );

    if (memory.hasDecisions) {
      parts.push(
        `## Recent Architectural Decisions\n${memory.recentDecisions}\n`,
      );
    }

    if (memory.hasBugs) {
      parts.push(`## Known Bugs & Lessons\n${memory.knownBugs}\n`);
    }

    if (memory.hasInsights) {
      parts.push(`## Team Insights\n${memory.insights}\n`);
    }

    if (!memory.hasDecisions && !memory.hasBugs && !memory.hasInsights) {
      parts.push(
        'No memory context found yet. Start documenting decisions and bugs to build project memory.',
      );
    }

    return parts.join('\n');
  }

  /**
   * Get summary of memory status
   */
  async getMemorySummary(): Promise<{
    total: number;
    loaded: number;
    status: string;
  }> {
    const memory = await this.loadMemoryContext();
    const loaded = [
      memory.hasDecisions,
      memory.hasBugs,
      memory.hasInsights,
    ].filter((b) => b).length;

    return {
      total: 3,
      loaded,
      status: `${loaded}/3 memory contexts loaded`,
    };
  }

  /**
   * Get detection of common hallucination patterns
   */
  async detectHallucinationRisks(): Promise<string[]> {
    const memory = await this.loadMemoryContext();
    const risks: string[] = [];

    // Check for repeated decisions
    if (
      memory.hasDecisions &&
      memory.recentDecisions.includes('changed twice')
    ) {
      risks.push('⚠️ Architecture decision instability detected');
    }

    // Check for repeated bugs
    const bugCount = (memory.knownBugs.match(/Bug:/g) || []).length;
    if (bugCount >= 5) {
      risks.push(
        `⚠️ ${bugCount} known bugs - be extra careful with similar changes`,
      );
    }

    // Check for security issues
    if (
      memory.knownBugs.toLowerCase().includes('security') ||
      memory.recentDecisions.toLowerCase().includes('security')
    ) {
      risks.push('🔒 Security concerns documented - review carefully');
    }

    // Check for performance issues
    if (
      memory.knownBugs.toLowerCase().includes('performance') ||
      memory.knownBugs.toLowerCase().includes('timeout')
    ) {
      risks.push('⚡ Performance issues known - optimize implementations');
    }

    return risks;
  }

  /**
   * Clear memory cache
   */
  clearCache(): void {
    this.cachedMemory = null;
    this.lastCacheTime = 0;
  }

  /**
   * Refresh memory from disk
   */
  async refreshMemory(): Promise<MemoryContext> {
    this.clearCache();
    return this.loadMemoryContext();
  }

  /**
   * Get targeted reminder based on memory analysis
   */
  async getTargetedReminder(): Promise<string | null> {
    const risks = await this.detectHallucinationRisks();

    if (risks.length === 0) {
      return null;
    }

    return (
      '## 🧠 Memory-Based Warnings\n\n' +
      risks.join('\n') +
      '\n\nReference the decisions and bugs logs for context.'
    );
  }
}

/**
 * Singleton instance
 */
let instance: MemoryInjectionService | null = null;

export function getMemoryInjectionService(): MemoryInjectionService {
  if (!instance) {
    instance = new MemoryInjectionService();
  }
  return instance;
}
