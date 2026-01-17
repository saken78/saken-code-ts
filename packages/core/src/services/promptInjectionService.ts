/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Content } from '@google/genai';

/**
 * Metrics tracking conversation state for intelligent prompt injection.
 */
export interface ConversationMetrics {
  turnCount: number;
  lastCorePromptInjectionTurn: number;
  consecutiveAssistantTurns: number;
  toolUsageCount: number;
  agentDelegationCount: number;
  errorEncounterCount: number;
  halluccinationIndicators: string[];
  complexityScore: number;
}

/**
 * Intelligent prompt injection service that minimizes hallucination
 * through strategic core prompt reinforcement.
 *
 * This service uses a MULTI-FACTOR APPROACH instead of naive "every 20 turns":
 * 1. **Conversation Depth:** Reinject when reasoning becomes deep
 * 2. **Complexity Spikes:** Reinject when task complexity increases
 * 3. **Tool Usage Patterns:** Reinject after heavy tool usage without validation
 * 4. **Error Patterns:** Reinject after encountering errors to prevent error cascade
 * 5. **Hallucination Indicators:** Reinject when detecting speculation without data
 * 6. **Agent Delegation Gaps:** Reinject when agents should have been used but weren't
 *
 * ROBUST FEATURES:
 * - Context-aware injection (doesn't disrupt ongoing work)
 * - Metric-based decision making (removes guesswork)
 * - Hallucination detection (proactive correction)
 * - Configurable thresholds (adapt to task type)
 */
export class PromptInjectionService {
  private metrics: ConversationMetrics = {
    turnCount: 0,
    lastCorePromptInjectionTurn: 0,
    consecutiveAssistantTurns: 0,
    toolUsageCount: 0,
    agentDelegationCount: 0,
    errorEncounterCount: 0,
    halluccinationIndicators: [],
    complexityScore: 0,
  };

  // Configuration thresholds
  private readonly MIN_TURNS_BETWEEN_INJECTION = 5; // Don't inject too frequently
  private readonly COMPLEXITY_THRESHOLD = 50; // When to consider task complex
  private readonly ERROR_THRESHOLD = 2; // Number of errors before reinforcement
  private readonly CONSECUTIVE_ASSISTANT_TURNS_THRESHOLD = 4; // Sign of extended reasoning
  private readonly TOOL_USAGE_SPIKE_THRESHOLD = 8; // Many tools used rapidly

  /**
   * Updates metrics based on the latest turn in the conversation.
   * @param history - Current conversation history
   */
  updateMetrics(history: readonly Content[]): void {
    this.metrics.turnCount = history.length;
    this.updateConsecutiveAssistantTurns(history);
    this.updateComplexityScore(history);
    this.detectHallucinationIndicators(history);
  }

  /**
   * Determines if core prompt should be injected at this point.
   * Uses multi-factor analysis to make robust decisions.
   * @returns true if prompt should be injected, false otherwise
   */
  shouldInjectCorePrompt(): boolean {
    const turnsSinceLastInjection =
      this.metrics.turnCount - this.metrics.lastCorePromptInjectionTurn;

    // Never inject too frequently to avoid disruption
    if (turnsSinceLastInjection < this.MIN_TURNS_BETWEEN_INJECTION) {
      return false;
    }

    // FACTOR 1: Conversation Depth - inject after sustained reasoning
    if (
      this.metrics.consecutiveAssistantTurns >=
      this.CONSECUTIVE_ASSISTANT_TURNS_THRESHOLD
    ) {
      return true;
    }

    // FACTOR 2: Complexity Spike - inject when task becomes complex
    if (this.metrics.complexityScore >= this.COMPLEXITY_THRESHOLD) {
      return true;
    }

    // FACTOR 3: Error Pattern - inject after multiple errors to prevent cascading
    if (this.metrics.errorEncounterCount >= this.ERROR_THRESHOLD) {
      return true;
    }

    // FACTOR 4: Hallucination Indicators - proactive correction
    if (this.metrics.halluccinationIndicators.length > 0) {
      return true;
    }

    // FACTOR 5: Tool Usage Spike - reinject after heavy tool usage
    if (this.metrics.toolUsageCount >= this.TOOL_USAGE_SPIKE_THRESHOLD) {
      return true;
    }

    // FACTOR 6: Extended Conversation - fallback to periodic injection
    // Using ~25 turns as fallback (more conservative than naive "every 20")
    if (turnsSinceLastInjection >= 25 && this.metrics.turnCount > 30) {
      return true;
    }

    return false;
  }

  /**
   * Records that core prompt has been injected.
   */
  recordCorePromptInjection(): void {
    this.metrics.lastCorePromptInjectionTurn = this.metrics.turnCount;
    // Reset hallucination indicators after injection
    this.metrics.halluccinationIndicators = [];
    // Reduce error count as we've reinforced best practices
    this.metrics.errorEncounterCount = Math.max(
      0,
      this.metrics.errorEncounterCount - 1,
    );
  }

  /**
   * Records a tool usage for tracking patterns.
   */
  recordToolUsage(): void {
    this.metrics.toolUsageCount++;
  }

  /**
   * Records agent delegation for tracking delegation patterns.
   */
  recordAgentDelegation(): void {
    this.metrics.agentDelegationCount++;
    // Reset tool usage counter when delegating (sign of proper workflow)
    this.metrics.toolUsageCount = 0;
  }

  /**
   * Records an error encounter for tracking error patterns.
   */
  recordErrorEncounter(): void {
    this.metrics.errorEncounterCount++;
  }

  /**
   * Gets current metrics for debugging or monitoring.
   */
  getMetrics(): Readonly<ConversationMetrics> {
    return Object.freeze({ ...this.metrics });
  }

  /**
   * Resets metrics for a new conversation/session.
   */
  resetMetrics(): void {
    this.metrics = {
      turnCount: 0,
      lastCorePromptInjectionTurn: 0,
      consecutiveAssistantTurns: 0,
      toolUsageCount: 0,
      agentDelegationCount: 0,
      errorEncounterCount: 0,
      halluccinationIndicators: [],
      complexityScore: 0,
    };
  }

  /**
   * Counts consecutive assistant turns (sign of extended reasoning/hallucination risk).
   */
  private updateConsecutiveAssistantTurns(history: readonly Content[]): void {
    let consecutive = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'model') {
        consecutive++;
      } else {
        break;
      }
    }
    this.metrics.consecutiveAssistantTurns = consecutive;
  }

  /**
   * Calculates complexity score based on conversation patterns.
   * Higher score = more complex reasoning happening.
   */
  private updateComplexityScore(history: readonly Content[]): void {
    let score = 0;

    // Factor 1: Conversation length (longer = generally more complex)
    score += Math.min(history.length, 50); // Cap at 50 to avoid over-weighting

    // Factor 2: Reasoning indicators in recent messages
    const recentMessages = history.slice(-5).map((msg) => {
      const text = this.extractTextFromContent(msg);
      return text.toLowerCase();
    });

    const complexityKeywords = [
      'plan',
      'implement',
      'architecture',
      'design',
      'refactor',
      'optimize',
      'complex',
      'multi-step',
      'integration',
      'edge case',
      'scenario',
      'performance',
      'scalability',
      'maintainability',
      'security',
      'vulnerability',
    ];

    for (const msg of recentMessages) {
      for (const keyword of complexityKeywords) {
        if (msg.includes(keyword)) {
          score += 5;
        }
      }
    }

    // Factor 3: Tool/Agent usage indicates active problem solving
    score += this.metrics.toolUsageCount * 2;
    score += this.metrics.agentDelegationCount * 3;

    this.metrics.complexityScore = Math.min(score, 100); // Cap at 100
  }

  /**
   * Detects patterns that indicate possible hallucination.
   */
  private detectHallucinationIndicators(history: readonly Content[]): void {
    const indicators: string[] = [];

    // Look for hallucination patterns in recent assistant messages
    const recentMessages = history
      .filter((msg) => msg.role === 'model')
      .slice(-3);

    for (const msg of recentMessages) {
      const text = this.extractTextFromContent(msg);

      // Pattern 1: Speculation without data verification
      if (
        (text.includes('probably') ||
          text.includes('likely') ||
          text.includes('assume')) &&
        !text.includes('/format-validator') &&
        !text.includes('/git-analyzer') &&
        !text.includes('/error-parser')
      ) {
        indicators.push('speculation-without-verification');
      }

      // Pattern 2: File operations without Read tool
      if (
        (text.includes('file') || text.includes('config')) &&
        !text.includes('read_file') &&
        text.length > 500
      ) {
        indicators.push('config-analysis-without-validation');
      }

      // Pattern 3: Error analysis without error-parser
      if (
        text.includes('error') &&
        text.includes('stack') &&
        !text.includes('/error-parser')
      ) {
        indicators.push('error-analysis-without-parser');
      }

      // Pattern 4: Type claims without type-safety-analyzer
      if (
        text.includes('type') &&
        text.includes('TypeScript') &&
        !text.includes('/type-safety-analyzer')
      ) {
        indicators.push('type-analysis-without-analyzer');
      }

      // Pattern 5: Security claims without security-audit
      if (text.includes('vulnerab') && !text.includes('/security-audit')) {
        indicators.push('security-claim-without-audit');
      }
    }

    this.metrics.halluccinationIndicators = indicators;
  }

  /**
   * Extracts text from a Content message (handles different formats).
   */
  private extractTextFromContent(msg: Content): string {
    if (!msg.parts) return '';

    return msg.parts
      .map((part) => {
        if (typeof part === 'string') return part;
        if ('text' in part) return part.text || '';
        return '';
      })
      .join('');
  }

  /**
   * Generates a system reminder for injection based on current issues.
   * This provides targeted reinforcement rather than generic reminder.
   */
  getTargetedReminderForInjection(): string {
    const indicators = this.metrics.halluccinationIndicators;

    if (indicators.length === 0) {
      return ''; // No targeted reminder needed
    }

    let reminder = '<system-reminder>\nCore prompt reinforcement:\n';

    if (indicators.includes('speculation-without-verification')) {
      reminder +=
        '- Data First: When analyzing files/configs, ALWAYS use /format-validator or agent tools to get actual data instead of speculation.\n';
    }
    if (indicators.includes('config-analysis-without-validation')) {
      reminder +=
        '- Config Files: Qwen treats YAML/TOML/XML as binary - ALWAYS validate with /format-validator or content-analyzer agent.\n';
    }
    if (indicators.includes('error-analysis-without-parser')) {
      reminder +=
        '- Error Parsing: ALWAYS use /error-parser for stack traces and error messages to extract exact location and cause.\n';
    }
    if (indicators.includes('type-analysis-without-analyzer')) {
      reminder +=
        '- Type Safety: Use /type-safety-analyzer for TypeScript type checking instead of guessing type compatibility.\n';
    }
    if (indicators.includes('security-claim-without-audit')) {
      reminder +=
        '- Security: Use /security-audit to scan code against known vulnerability patterns instead of making claims.\n';
    }

    reminder += '</system-reminder>';
    return reminder;
  }
}
