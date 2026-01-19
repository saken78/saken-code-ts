/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 *
 * Subagent Router
 * Automatically detects task type and routes to appropriate specialized agent
 * This enforces: "ALWAYS USE subagent first, Skills, Extensions"
 */

import type { Config } from '../config/config.js';
import {
  detectTaskType,
  getRecommendedAgent,
  type TaskType,
  type TaskDetectionResult,
} from './task-type-detector.js';
import type { PartUnion } from '@google/genai';

export interface RoutingDecision {
  taskType: TaskType;
  shouldDelegate: boolean;
  recommendedAgent: string | null;
  confidence: number;
  reasoning: string;
  routingTime: number;
}

/**
 * Router that automatically routes tasks to specialized subagents
 */
export class SubagentRouter {
  private config: Config;
  private enabled: boolean;
  private debug: boolean;
  private confidenceThreshold: number = 0.3; // Lower threshold - single pattern match (0.7) easily passes

  constructor(config: Config, enabled: boolean = true, debug: boolean = false) {
    this.config = config;
    this.enabled = enabled;
    this.debug = debug;
  }

  /**
   * Analyze user input and make routing decision
   */
  async analyzeAndRoute(userInput: string): Promise<RoutingDecision> {
    const startTime = Date.now();

    if (!this.enabled) {
      return {
        taskType: 'general',
        shouldDelegate: false,
        recommendedAgent: null,
        confidence: 0,
        reasoning: 'Router disabled',
        routingTime: 0,
      };
    }

    try {
      this.logDebug(
        `[SubagentRouter] Analyzing input: "${userInput.substring(0, 60)}..."`,
      );

      // Detect task type
      const detection: TaskDetectionResult = detectTaskType(userInput);

      this.logDebug(
        `[SubagentRouter] Detected: ${detection.type} (confidence: ${detection.confidence})`,
      );

      // Get recommended agent
      const recommendedAgent = getRecommendedAgent(detection.type);

      // Make routing decision
      const shouldDelegate =
        recommendedAgent !== null &&
        detection.confidence >= this.confidenceThreshold;

      const reasoning = this.createReasoning(
        detection.type,
        detection.confidence,
        recommendedAgent,
        shouldDelegate,
      );

      this.logDebug(
        `[SubagentRouter] Decision: ${shouldDelegate ? `✓ DELEGATE to ${recommendedAgent}` : '✗ NO DELEGATION'}`,
      );

      return {
        taskType: detection.type,
        shouldDelegate,
        recommendedAgent,
        confidence: detection.confidence,
        reasoning,
        routingTime: Date.now() - startTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logDebug(`[SubagentRouter] Error during analysis: ${errorMsg}`);

      return {
        taskType: 'general',
        shouldDelegate: false,
        recommendedAgent: null,
        confidence: 0,
        reasoning: `Routing analysis failed: ${errorMsg}`,
        routingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Create human-readable reasoning for routing decision
   */
  private createReasoning(
    taskType: TaskType,
    confidence: number,
    agent: string | null,
    willDelegate: boolean,
  ): string {
    if (taskType === 'general') {
      return 'Task type is general - no specialized agent needed';
    }

    const confPercent = (confidence * 100).toFixed(0);

    if (willDelegate) {
      return `${taskType} task detected (${confPercent}% confidence) → Delegating to ${agent} agent for specialized handling`;
    } else {
      return `${taskType} task detected (${confPercent}% confidence) → Confidence below threshold (${(this.confidenceThreshold * 100).toFixed(0)}%) - proceeding with main agent`;
    }
  }

  /**
   * Check if subagent is available
   */
  async isAgentAvailable(agentName: string): Promise<boolean> {
    try {
      const subagentManager = this.config.getSubagentManager();
      const agent = await subagentManager.loadSubagent(agentName);
      return agent !== null;
    } catch {
      return false;
    }
  }

  /**
   * Create delegation instruction for LLM
   */
  createDelegationInstruction(decision: RoutingDecision): PartUnion | null {
    if (!decision.shouldDelegate || !decision.recommendedAgent) {
      return null;
    }

    const instruction = `
[TASK ROUTING]: This task has been identified as a "${decision.taskType}" task.
For best results, please delegate this to the "${decision.recommendedAgent}" agent using the TASK tool:

Example:
\`\`\`
/task ${decision.recommendedAgent} <task-description>
\`\`\`

Or use the TASK tool directly:
tool: "task"
parameters:
  skill: "${decision.recommendedAgent}"
  description: "<your task description>"
`;

    return { text: instruction };
  }

  /**
   * Set confidence threshold for routing decisions
   */
  setConfidenceThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }
    this.confidenceThreshold = threshold;
    this.logDebug(
      `[SubagentRouter] Confidence threshold set to ${(threshold * 100).toFixed(0)}%`,
    );
  }

  /**
   * Enable/disable router
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.logDebug(
      `[SubagentRouter] Router ${enabled ? 'enabled' : 'disabled'}`,
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
 * Singleton instance
 */
let routerInstance: SubagentRouter | null = null;

/**
 * Get or create router instance
 */
export function getSubagentRouter(
  config: Config,
  enabled: boolean = true,
): SubagentRouter {
  if (!routerInstance) {
    routerInstance = new SubagentRouter(
      config,
      enabled,
      process.env['DEBUG'] === 'true',
    );
  }
  return routerInstance;
}
