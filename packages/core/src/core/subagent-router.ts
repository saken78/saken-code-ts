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
  type TaskType,
  type TaskDetectionResult,
} from './task-type-detector.js';
import type { PartUnion } from '@google/genai';

interface AvailableAgent {
  name: string;
  capabilities: string[];
  description?: string;
  loaded: boolean;
}

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
  private availableAgents: Map<string, AvailableAgent> = new Map();

  constructor(config: Config, enabled: boolean = true, debug: boolean = false) {
    this.config = config;
    this.enabled = enabled;
    this.debug = debug;
  }

  /**
   * Discover and cache available agents from the subagent manager
   * Dynamically lists all available agents instead of using hardcoded names
   */
  private async discoverAvailableAgents(
    forceRefresh: boolean = false,
  ): Promise<void> {
    if (this.availableAgents.size > 0 && !forceRefresh) {
      return; // Already cached and refresh not forced
    }

    // If not forcing refresh, clear the cache to allow for fresh discovery
    if (forceRefresh) {
      this.availableAgents.clear();
    }

    try {
      const subagentManager = this.config.getSubagentManager();

      // Dynamically list all available agents from SubagentManager
      const allAgents = await subagentManager.listSubagents({
        force: forceRefresh, // Use cache if available, unless forced refresh
      });

      for (const agentConfig of allAgents) {
        try {
          // Validate agent configuration before adding to available agents
          if (!this.isValidAgentConfig(agentConfig)) {
            console.warn(
              `[SubagentRouter] Warning: Skipping invalid agent configuration: ${agentConfig.name}`,
            );
            continue; // Skip invalid agent configurations
          }

          this.availableAgents.set(agentConfig.name, {
            name: agentConfig.name,
            capabilities: agentConfig.tools || [], // Use declared tools as capabilities
            description: agentConfig.description,
            loaded: true,
          });

          this.logDebug(
            `[SubagentRouter] Discovered agent: ${agentConfig.name} with capabilities: ${agentConfig.tools?.join(', ') || 'none'}`,
          );
        } catch (error) {
          // Agent discovery failed for this agent, skip
          this.logDebug(
            `[SubagentRouter] Failed to process agent ${agentConfig.name}: ${error}`,
          );
          // Log error as warning so users are aware of registration failures
          console.warn(
            `[SubagentRouter] Warning: Failed to process agent ${agentConfig.name}: ${error}`,
          );
        }
      }
    } catch (error) {
      this.logDebug(`[SubagentRouter] Failed to discover agents: ${error}`);
    }
  }

  /**
   * Find the best available agent for a task type
   * Uses dynamic matching based on available agent metadata
   */
  private async findBestAgent(
    taskType: TaskType,
    forceRefresh: boolean = false,
  ): Promise<string | null> {
    await this.discoverAvailableAgents(forceRefresh);

    // If no agents available, return null
    if (this.availableAgents.size === 0) {
      return null;
    }

    // Convert available agents to array format for matching
    const agentsList = Array.from(this.availableAgents.values()).map(
      (agent) => ({
        name: agent.name,
        description: agent.description || '',
      }),
    );

    // Use dynamic matching from task-type-detector
    // Import it at the top of this file
    const recommendedAgent = this.matchAgentToTaskType(taskType, agentsList);

    if (recommendedAgent && this.availableAgents.has(recommendedAgent)) {
      return recommendedAgent;
    }

    return null;
  }

  /**
   * Public method to refresh the agent cache
   */
  async refreshAgentCache(): Promise<void> {
    await this.discoverAvailableAgents(true); // force refresh
    this.logDebug('[SubagentRouter] Agent cache refreshed');
  }

  /**
   * Match task type to agent based on agent metadata
   * Uses keyword matching on agent names and descriptions
   */
  private matchAgentToTaskType(
    taskType: TaskType,
    availableAgents: Array<{ name: string; description: string }>,
  ): string | null {
    // Task type to keywords mapping - matches actual builtin agent names
    const taskTypeToKeywords: Record<TaskType, string[]> = {
      'codebase-exploration': [
        'explorer',
        'exploration',
        'codebase',
        'navigate',
        'find',
      ],
      debugging: ['debugger', 'debug', 'error', 'troubleshoot', 'diagnosis'],
      'code-review': ['reviewer', 'review', 'quality', 'security', 'audit'],
      planning: ['planner', 'plan', 'design', 'architecture'],
      deepthink: [
        'deepthink',
        'deep',
        'think',
        'analyze',
        'reasoning',
        'analyze deeply',
        'think deeply',
        'deep analysis',
        'comprehensive analysis',
        'strategic planning',
        'complex problem',
        'multi dimensional',
        'thorough exploration',
        'solution space',
        'critical thinking',
        'analytical thinking',
        'deep thought',
      ],
      research: [
        'research-orchestrator',
        'research',
        'researcher',
        'academic',
        'investigate',
        'coordinator',
        'research-brief-generator',
        'research-coordinator',
        'academic-researcher',
        'research-synthesizer',
      ],
      'content-analysis': [
        'content-analyzer',
        'analyzer',
        'analysis',
        'content',
        'synthesizer',
        'evaluate',
      ],
      'tool-creation': [
        'tool-creator',
        'tool',
        'creator',
        'generator',
        'builder',
        'automation',
      ],
      'technical-research': [
        'technical-researcher',
        'technical',
        'researcher',
        'performance',
        'architecture',
        'system',
      ],
      'prompt-engineering': [
        'prompt-engineer',
        'engineer',
        'prompt',
        'instruction',
        'optimization',
        'clarifier',
        'query-clarifier',
      ],
      'data-analysis': [
        'data-analyst',
        'analyst',
        'data',
        'visualization',
        'report',
        'generator',
        'report-generator',
      ],
      general: [],
    };

    const keywords = taskTypeToKeywords[taskType];

    // For general task type, return null (no specialization needed)
    if (taskType === 'general') {
      return null;
    }

    // Find agent with best keyword match
    let bestAgent: string | null = null;
    let bestScore = 0;

    for (const agent of availableAgents) {
      let score = 0;
      const lowerName = agent.name.toLowerCase();
      const lowerDescription = agent.description.toLowerCase();

      // Enhanced scoring algorithm
      for (const keyword of keywords) {
        // Exact matches in name get highest score
        if (lowerName === keyword) {
          score += 10;
        }
        // Check for keyword as a complete part separated by hyphens (for kebab-case agent names)
        else if (lowerName.split('-').includes(keyword)) {
          score += 7;
        }
        // Partial matches in name get medium-high score
        else if (lowerName.includes(keyword)) {
          score += 5;
        }

        // Exact matches in description get high-medium score
        if (
          lowerDescription.includes(` ${keyword} `) ||
          lowerDescription.startsWith(`${keyword} `) ||
          lowerDescription.endsWith(` ${keyword}`) ||
          lowerDescription.includes(` ${keyword},`) ||
          lowerDescription.includes(` ${keyword}.`)
        ) {
          score += 4;
        }
        // Partial matches in description get medium score
        else if (lowerDescription.includes(keyword)) {
          score += 2;
        }
      }

      // Additional bonus for agents with more comprehensive descriptions that mention the task
      if (
        keywords.some((kw) => lowerDescription.includes(kw)) &&
        lowerDescription.length > 50
      ) {
        score += 1; // Small bonus for detailed descriptions that match
      }

      // Update best match if this agent scores higher
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent.name;
      }
    }

    // Return best match if found with reasonable confidence
    return bestScore > 0 ? bestAgent : null;
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

      // Find best available agent using dynamic discovery
      const recommendedAgent = await this.findBestAgent(detection.type, false);

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

      // Detailed logging to help understand routing decisions
      this.logDebug(
        `[SubagentRouter] Task type: ${detection.type}, Confidence: ${(detection.confidence * 100).toFixed(2)}%, Threshold: ${(this.confidenceThreshold * 100).toFixed(2)}%`,
      );
      this.logDebug(
        `[SubagentRouter] Recommended agent: ${recommendedAgent || 'none'}, Available agents: ${Array.from(this.availableAgents.keys()).join(', ') || 'none'}`,
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

    const confPercent = (confidence * 100).toFixed(2);
    const thresholdPercent = (this.confidenceThreshold * 100).toFixed(2);

    if (willDelegate) {
      return `${taskType} task detected (${confPercent}% confidence, threshold: ${thresholdPercent}%) → Delegating to ${agent} agent for specialized handling`;
    } else {
      if (agent) {
        return `${taskType} task detected (${confPercent}% confidence) → Agent ${agent} found but confidence below threshold (${thresholdPercent}%) - proceeding with main agent`;
      } else {
        return `${taskType} task detected (${confPercent}% confidence) → No suitable agent found - proceeding with main agent`;
      }
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

  /**
   * Validates if an agent configuration is valid
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isValidAgentConfig(agentConfig: any): boolean {
    // Check if agent config has required properties
    if (!agentConfig || typeof agentConfig !== 'object') {
      return false;
    }

    // Agent must have a name
    if (
      !agentConfig.name ||
      typeof agentConfig.name !== 'string' ||
      agentConfig.name.trim() === ''
    ) {
      console.warn(
        `[SubagentRouter] Agent validation failed: Missing or invalid name`,
      );
      return false;
    }

    // Agent should have a description
    if (
      !agentConfig.description ||
      typeof agentConfig.description !== 'string' ||
      agentConfig.description.trim() === ''
    ) {
      console.warn(
        `[SubagentRouter] Agent validation failed: Missing or invalid description for agent ${agentConfig.name}`,
      );
      return false;
    }

    // Basic validation passed
    return true;
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
