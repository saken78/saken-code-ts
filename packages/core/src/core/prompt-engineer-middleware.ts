/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 *
 * Prompt Engineer Middleware
 * Intercepts and optimizes user input through prompt engineer agent FIRST
 * This enforces: "ALWAYS PROCESS USER PROMPTS THROUGH promptEngineerAgent FIRST"
 */

import type { Config } from '../config/config.js';
import type { PartUnion } from '@google/genai';
import type { SubagentConfig } from '../subagents/types.js';

export interface PromptOptimizationResult {
  originalPrompt: string;
  optimizedPrompt: string;
  changes: string[];
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * Middleware that enforces prompt engineer optimization BEFORE any other processing
 * This is called FIRST in the message pipeline
 */
export class PromptEngineerMiddleware {
  private config: Config;
  private enabled: boolean;
  private debug: boolean;

  constructor(config: Config, enabled: boolean = true, debug: boolean = false) {
    this.config = config;
    this.enabled = enabled;
    this.debug = debug;
  }

  /**
   * Process user input through prompt engineer agent
   * Returns optimized prompt or original if optimization fails
   */
  async processUserInput(
    userPrompt: string,
  ): Promise<PromptOptimizationResult> {
    const startTime = Date.now();

    if (!this.enabled) {
      return {
        originalPrompt: userPrompt,
        optimizedPrompt: userPrompt,
        changes: [],
        duration: 0,
        success: true,
      };
    }

    try {
      this.logDebug(
        `[PromptEngineer] Processing input (${userPrompt.length} chars)`,
      );

      // Get prompt engineer agent
      const subagentManager = this.config.getSubagentManager();
      const promptEngineerAgent =
        await subagentManager.loadSubagent('prompt-engineer');

      if (!promptEngineerAgent) {
        this.logDebug(
          '[PromptEngineer] Agent not found, skipping optimization',
        );
        return {
          originalPrompt: userPrompt,
          optimizedPrompt: userPrompt,
          changes: [],
          duration: Date.now() - startTime,
          success: true,
        };
      }

      // Create optimization request
      const optimizationPrompt = this.createOptimizationRequest(userPrompt);

      this.logDebug(
        '[PromptEngineer] Invoking agent with optimization request',
      );

      // Call prompt engineer agent
      // Note: This is a simplified call - actual implementation depends on agent interface
      const optimizationResult = await this.invokePromptEngineer(
        promptEngineerAgent,
        optimizationPrompt,
        userPrompt,
      );

      const duration = Date.now() - startTime;

      if (optimizationResult.success) {
        this.logDebug(
          `[PromptEngineer] ✓ Optimization complete (${duration}ms, ${optimizationResult.changes.length} changes)`,
        );
        return {
          originalPrompt: userPrompt,
          optimizedPrompt: optimizationResult.optimizedPrompt,
          changes: optimizationResult.changes,
          duration,
          success: true,
        };
      } else {
        this.logDebug(
          `[PromptEngineer] ✗ Optimization failed: ${optimizationResult.error}, using original`,
        );
        return {
          originalPrompt: userPrompt,
          optimizedPrompt: userPrompt,
          changes: [],
          duration,
          success: true, // Fall back gracefully
          error: optimizationResult.error,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      this.logDebug(
        `[PromptEngineer] ✗ Exception: ${errorMsg}, using original prompt`,
      );

      return {
        originalPrompt: userPrompt,
        optimizedPrompt: userPrompt,
        changes: [],
        duration,
        success: true, // Fail gracefully
        error: errorMsg,
      };
    }
  }

  /**
   * Create optimization request for prompt engineer agent
   */
  private createOptimizationRequest(userPrompt: string): string {
    return `
You are a prompt optimization expert. Analyze and improve the following user prompt:

ORIGINAL PROMPT:
"""
${userPrompt}
"""

OPTIMIZATION TASK:
1. Clarify ambiguous intent
2. Add missing context or constraints
3. Suggest better phrasing for clarity
4. Identify if this needs subagent delegation
5. Return ONLY the optimized prompt in a code block

Format your response as:
\`\`\`
[OPTIMIZED PROMPT HERE]
\`\`\`

Changes made:
- [Change 1]
- [Change 2]
- ...
`;
  }

  /**
   * Invoke prompt engineer agent
   * Note: This is a placeholder - actual implementation depends on agent framework
   */
  private async invokePromptEngineer(
    agent: SubagentConfig | null,
    optimizationPrompt: string,
    originalPrompt: string,
  ): Promise<{
    success: boolean;
    optimizedPrompt: string;
    changes: string[];
    error?: string;
  }> {
    try {
      // This is a simplified placeholder
      // Actual implementation would call agent.execute() or similar
      // and parse the response to extract optimized prompt

      this.logDebug('[PromptEngineer] Agent invocation placeholder');

      // For now, return original prompt
      // In production, this would parse agent response
      return {
        success: true,
        optimizedPrompt: originalPrompt,
        changes: [],
      };
    } catch (error) {
      return {
        success: false,
        optimizedPrompt: originalPrompt,
        changes: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Convert optimized prompt into system message parts
   */
  convertToSystemMessage(result: PromptOptimizationResult): PartUnion[] {
    if (result.optimizedPrompt === result.originalPrompt) {
      return [{ text: result.originalPrompt }];
    }

    const parts: PartUnion[] = [{ text: result.optimizedPrompt }];

    // Optionally append optimization notes
    if (result.changes.length > 0 && result.duration < 5000) {
      // Only append if optimization was fast enough
      parts.push({
        text: `\n[Prompt optimized by prompt engineer in ${result.duration}ms: ${result.changes.join('; ')}]`,
      });
    }

    return parts;
  }

  /**
   * Enable/disable middleware
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.logDebug(
      `[PromptEngineer] Middleware ${enabled ? 'enabled' : 'disabled'}`,
    );
  }

  /**
   * Enable/disable debug logging
   */
  setDebug(debug: boolean): void {
    this.debug = debug;
  }

  private logDebug(message: string): void {
    if (this.debug) {
      console.debug(message);
    }
  }
}

/**
 * Singleton instance of middleware
 */
let middlewareInstance: PromptEngineerMiddleware | null = null;

/**
 * Get or create middleware instance
 */
export function getPromptEngineerMiddleware(
  config: Config,
  enabled: boolean = true,
): PromptEngineerMiddleware {
  if (!middlewareInstance) {
    middlewareInstance = new PromptEngineerMiddleware(
      config,
      enabled,
      process.env['DEBUG'] === 'true',
    );
  }
  return middlewareInstance;
}
