/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SubagentManager } from './subagent-manager.js';
import type { SkillManager } from '../skills/skill-manager.js';
import type { SubagentConfig } from './types.js';
import type { SkillConfig } from '../skills/types.js';

/**
 * Integration service that connects subagent and skill systems
 */
export class SubagentSkillIntegrationService {
  constructor(
    private readonly subagentManager: SubagentManager,
    private readonly skillManager: SkillManager
  ) {}

  /**
   * Analyzes a task and determines if it should be handled by a subagent or skill
   * @param taskDescription - The user's task or query
   * @returns Object containing recommended action and confidence
   */
  async analyzeTask(taskDescription: string): Promise<{
    useSubagent: boolean;
    useSkill: boolean;
    subagent?: SubagentConfig;
    skill?: SkillConfig;
    confidence: number;
    reason: string;
  }> {
    // Check for subagent matches
    const allSubagents = await this.subagentManager.listSubagents();
    const matchingSubagents = allSubagents.filter(subagent =>
      taskDescription.toLowerCase().includes(subagent.name.toLowerCase()) ||
      taskDescription.toLowerCase().includes(subagent.description.toLowerCase())
    );
    const bestSubagentMatch = matchingSubagents[0];

    // Check for skill matches
    const allSkills = await this.skillManager.listSkills();
    const matchingSkills = allSkills.filter(skill =>
      taskDescription.toLowerCase().includes(skill.name.toLowerCase()) ||
      taskDescription.toLowerCase().includes(skill.description.toLowerCase())
    );
    const bestSkillMatch = matchingSkills[0];

    // Determine which is more confident
    const subagentConfidence = bestSubagentMatch ? 0.6 : 0;
    const skillConfidence = bestSkillMatch ? 0.8 : 0; // Fixed confidence for skill matches

    if (subagentConfidence >= skillConfidence && bestSubagentMatch) {
      return {
        useSubagent: true,
        useSkill: false,
        subagent: bestSubagentMatch,
        confidence: subagentConfidence,
        reason: `Subagent "${bestSubagentMatch.name}" matches with confidence ${subagentConfidence.toFixed(2)} based on description: ${bestSubagentMatch.description}`
      };
    } else if (skillConfidence > subagentConfidence && bestSkillMatch) {
      return {
        useSubagent: false,
        useSkill: true,
        skill: bestSkillMatch,
        confidence: skillConfidence,
        reason: `Skill "${bestSkillMatch.name}" matches task requirements`
      };
    } else {
      return {
        useSubagent: false,
        useSkill: false,
        confidence: 0,
        reason: 'No suitable subagent or skill found for this task'
      };
    }
  }

  /**
   * Determines if a task should use an automated agent/skill approach
   * @param taskDescription - The user's task or query
   * @param minConfidence - Minimum confidence threshold (default: 0.5)
   * @returns True if an agent or skill should be used
   */
  async shouldUseAutomation(taskDescription: string, minConfidence: number = 0.5): Promise<boolean> {
    const result = await this.analyzeTask(taskDescription);
    return result.confidence >= minConfidence;
  }

  /**
   * Gets the recommended subagent for a task
   * @param taskDescription - The user's task or query
   * @returns Recommended subagent config or undefined
   */
  async getRecommendedSubagent(taskDescription: string): Promise<SubagentConfig | undefined> {
    const result = await this.analyzeTask(taskDescription);
    return result.useSubagent ? result.subagent : undefined;
  }

  /**
   * Gets the recommended skill for a task
   * @param taskDescription - The user's task or query
   * @returns Recommended skill config or undefined
   */
  async getRecommendedSkill(taskDescription: string): Promise<SkillConfig | undefined> {
    const result = await this.analyzeTask(taskDescription);
    return result.useSkill ? result.skill : undefined;
  }
}