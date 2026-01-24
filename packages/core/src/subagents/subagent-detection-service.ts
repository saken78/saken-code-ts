/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SubagentConfig, SubagentLevel } from './types.js';
import type { SubagentManager } from './subagent-manager.js';

/**
 * Represents a detected subagent match with confidence score
 */
export interface SubagentMatch {
  /** The matched subagent configuration */
  config: SubagentConfig;
  /** Confidence score from 0 to 1, where 1 is highest confidence */
  confidence: number;
  /** Reason for the match */
  reason: string;
}

/**
 * Service to automatically detect when to use subagents based on user input
 * Uses multi-strategy matching to improve detection accuracy, especially
 * when dealing with configuration files (YAML, TOML, XML, etc.)
 */
export class SubagentDetectionService {
  // Extended keyword sets for each agent type
  private readonly agentKeywordMaps = new Map<string, string[]>([
    // Explorer keywords
    [
      'explorer',
      [
        'explore',
        'find',
        'search',
        'navigate',
        'structure',
        'architecture',
        'locate',
        'where is',
        'discover',
        'browse',
        'traverse',
        'walkthrough',
        'examine structure',
        'list files',
        'directory',
        'tree',
        'codebase layout',
        'project structure',
        'file organization',
        'code layout',
      ],
    ],
    // Planner keywords
    [
      'planner',
      [
        'plan',
        'organize',
        'break down',
        'schedule',
        'outline',
        'structure',
        'arrange',
        'organize',
        'task breakdown',
        'implementation plan',
        'steps',
        'approach',
        'strategy',
        'sequence',
        'order',
        'prioritize',
        'roadmap',
        'milestone',
        'planning',
        'organize work',
        'work breakdown',
      ],
    ],
    // Debugger keywords
    [
      'debugger',
      [
        'debug',
        'fix',
        'error',
        'issue',
        'problem',
        'troubleshoot',
        'crash',
        'exception',
        'bug',
        'trace',
        'stack trace',
        'reproduce',
        'root cause',
        'diagnose',
        'failing',
        'broken',
        'not working',
        "doesn't work",
        'bug fix',
        'error handling',
        'exception handling',
        'debugging',
      ],
    ],
    // Reviewer keywords
    [
      'reviewer',
      [
        'review',
        'check',
        'audit',
        'security',
        'quality',
        'best practice',
        'improve',
        'feedback',
        'analysis',
        'inspect',
        'examine',
        'verify',
        'validate',
        'assess',
        'evaluate',
        'code review',
        'security review',
        'quality check',
        'convention',
        'standard',
        'lint',
      ],
    ],
    // Content analyzer keywords
    [
      'content-analyzer',
      [
        'analyze',
        'summarize',
        'extract',
        'document',
        'specification',
        'requirement',
        'endpoint',
        'parameter',
        'explain',
        'understand',
        'compare',
        'interpret',
        'parse',
        'read content',
        'content analysis',
        'documentation analysis',
        'spec analysis',
        'understand document',
      ],
    ],
    // Shadcn migrator keywords
    [
      'shadcn-migrator',
      [
        'shadcn',
        'migration',
        'ui components',
        'component library',
        'modernize ui',
        'migrate',
        'upgrade ui',
        'replace div',
        'component replacement',
        'ui update',
        'refactor ui',
        'modernize components',
      ],
    ],
  ]);

  constructor(private readonly subagentManager: SubagentManager) {}

  /**
   * Analyzes a user task and determines if any subagent should be used
   * @param taskDescription - The user's task or query
   * @param availableLevels - Levels to search for subagents (defaults to all)
   * @returns Array of matching subagents sorted by confidence
   */
  async detectSubagents(
    taskDescription: string,
    availableLevels?: SubagentLevel[],
  ): Promise<SubagentMatch[]> {
    const levelsToCheck: SubagentLevel[] = availableLevels || [
      'project',
      'user',
      'builtin',
    ];
    const allMatches: SubagentMatch[] = [];

    // Get all available subagents
    for (const level of levelsToCheck) {
      const subagents = await this.subagentManager.listSubagents({ level });

      for (const subagent of subagents) {
        const match = this.analyzeSubagentFit(taskDescription, subagent);
        if (match.confidence > 0) {
          allMatches.push(match);
        }
      }
    }

    // Sort by confidence descending
    return allMatches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyzes how well a subagent fits a given task using multi-strategy matching
   * @param taskDescription - The user's task or query
   * @param subagent - The subagent to evaluate
   * @returns SubagentMatch with confidence score
   */
  private analyzeSubagentFit(
    taskDescription: string,
    subagent: SubagentConfig,
  ): SubagentMatch {
    const lowerTask = taskDescription.toLowerCase();
    const lowerDesc = subagent.description.toLowerCase();
    const lowerPrompt = subagent.systemPrompt.toLowerCase();
    const lowerName = subagent.name.toLowerCase();

    let confidence = 0;
    const reasons: string[] = [];

    // ===== STRATEGY 1: Extended Keyword Matching (HIGHEST PRIORITY) =====
    // Uses comprehensive keyword maps for each agent type
    const extendedKeywords = this.agentKeywordMaps.get(lowerName) || [];
    const allKeywords = [
      ...(subagent.triggerKeywords || []),
      ...extendedKeywords,
    ];

    let keywordMatchCount = 0;
    for (const keyword of allKeywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerTask.includes(lowerKeyword)) {
        keywordMatchCount++;
        if (keywordMatchCount === 1) {
          reasons.push(`Keyword matched: "${keyword}"`);
        }
      }
    }

    if (keywordMatchCount > 0) {
      // Boost confidence based on number of keyword matches
      confidence += Math.min(0.6, 0.3 + keywordMatchCount * 0.15);
      if (keywordMatchCount > 1) {
        reasons.push(`${keywordMatchCount} keywords matched`);
      }
    }

    // ===== STRATEGY 2: Capability-Based Matching =====
    // Match task requirements with agent capabilities
    if (subagent.capabilities && subagent.capabilities.length > 0) {
      const capabilityScore = this.matchCapabilities(
        lowerTask,
        subagent.capabilities,
      );
      if (capabilityScore > 0) {
        confidence += capabilityScore * 0.25;
        reasons.push(
          `Capabilities match (${Math.round(capabilityScore * 100)}%)`,
        );
      }
    }

    // ===== STRATEGY 3: Description Similarity (MEDIUM PRIORITY) =====
    // Only use if keyword matching didn't work well
    if (keywordMatchCount === 0) {
      const similarityScore = this.calculateSimilarity(lowerTask, lowerDesc);
      if (similarityScore > 0.3) {
        confidence += similarityScore * 0.4;
        reasons.push(
          `Description similarity: ${Math.round(similarityScore * 100)}%`,
        );
      }
    }

    // ===== STRATEGY 4: System Prompt Relevance =====
    // Use prompt content as fallback
    if (confidence < 0.3) {
      const promptSimilarity = this.calculateSimilarity(lowerTask, lowerPrompt);
      if (promptSimilarity > 0.2) {
        confidence += promptSimilarity * 0.3;
        reasons.push(
          `System prompt relevant: ${Math.round(promptSimilarity * 100)}%`,
        );
      }
    }

    // ===== STRATEGY 5: File Format Detection =====
    // Special handling for config files (YAML, TOML, XML, JSON)
    const fileFormatScore = this.detectFileFormatNeeds(lowerTask);
    if (fileFormatScore > 0 && this.agentHandlesConfigs(lowerName)) {
      confidence += fileFormatScore * 0.2;
      reasons.push(`Config file handling detected`);
    }

    // ===== STRATEGY 6: Tool Availability Check =====
    // Boost confidence if agent has necessary tools for the task
    const toolScore = this.matchToolsToTask(lowerTask, subagent.tools || []);
    if (toolScore > 0) {
      confidence += toolScore * 0.15;
      reasons.push(`Required tools available`);
    }

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return {
      config: subagent,
      confidence,
      reason:
        reasons.length > 0 ? reasons.join('; ') : 'No matching criteria found',
    };
  }

  /**
   * Match task requirements with agent capabilities
   */
  private matchCapabilities(
    taskDescription: string,
    capabilities: string[],
  ): number {
    let matches = 0;

    for (const capability of capabilities) {
      const capWords = capability.toLowerCase().split(/[_\s]+/);
      for (const word of capWords) {
        if (taskDescription.includes(word)) {
          matches++;
        }
      }
    }

    return matches > 0 ? Math.min(1, matches / capabilities.length) : 0;
  }

  /**
   * Detect if task mentions config file formats
   */
  private detectFileFormatNeeds(taskDescription: string): number {
    const formats = [
      'yaml',
      'yml',
      'toml',
      'xml',
      'json',
      'config',
      'configuration',
      'spec',
      'specification',
      'manifest',
    ];

    let score = 0;
    for (const format of formats) {
      if (taskDescription.includes(format)) {
        score += 0.25;
      }
    }

    return Math.min(1, score);
  }

  /**
   * Check if agent is capable of handling config files
   */
  private agentHandlesConfigs(agentName: string): boolean {
    // Agents that can handle config files well
    const configHandlers = [
      'content-analyzer',
      'reviewer',
      'explorer',
      'debugger',
    ];
    return configHandlers.includes(agentName);
  }

  /**
   * Match task tools with agent available tools
   */
  private matchToolsToTask(
    taskDescription: string,
    agentTools: string[],
  ): number {
    const taskKeywords = [
      {
        keywords: ['read', 'view', 'examine', 'look at'],
        tools: ['read_file', 'read_many_files', 'grep_search'],
      },
      {
        keywords: ['write', 'edit', 'modify', 'change'],
        tools: ['write_file', 'edit'],
      },
      {
        keywords: ['search', 'find', 'grep', 'pattern'],
        tools: ['grep_search', 'glob'],
      },
      {
        keywords: ['file', 'directory', 'folder', 'ls'],
        tools: ['glob', 'list_directory'],
      },
      { keywords: ['shell', 'command', 'run'], tools: ['shell'] },
      {
        keywords: ['plan', 'organize', 'track'],
        tools: ['todo_write', 'save_memory'],
      },
    ];

    let toolScore = 0;
    const agentToolSet = new Set(agentTools);

    for (const taskTool of taskKeywords) {
      const hasKeyword = taskTool.keywords.some((kw) =>
        taskDescription.includes(kw),
      );
      const hasTools = taskTool.tools.some((tool) => agentToolSet.has(tool));

      if (hasKeyword && hasTools) {
        toolScore += 0.2;
      }
    }

    return Math.min(1, toolScore);
  }

  /**
   * Calculates similarity between two strings using a simple algorithm
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Similarity score from 0 to 1
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Simple word overlap algorithm
    const words1 = str1.split(/\s+/).filter((w) => w.length > 2); // Only consider words longer than 2 chars
    const words2 = str2.split(/\s+/).filter((w) => w.length > 2);

    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    let matches = 0;
    for (const word of set1) {
      if (set2.has(word)) {
        matches++;
      }
    }

    // Jaccard similarity
    const unionSize = new Set([...set1, ...set2]).size;
    return unionSize > 0 ? matches / unionSize : 0;
  }

  /**
   * Determines if any subagent should be used for the given task
   * @param taskDescription - The user's task or query
   * @param minConfidence - Minimum confidence threshold (default: 0.5)
   * @returns The best matching subagent or null if none meet threshold
   */
  async shouldUseSubagent(
    taskDescription: string,
    minConfidence: number = 0.5,
  ): Promise<SubagentConfig | null> {
    const matches = await this.detectSubagents(taskDescription);
    const bestMatch = matches[0];

    if (bestMatch && bestMatch.confidence >= minConfidence) {
      return bestMatch.config;
    }

    return null;
  }
}
