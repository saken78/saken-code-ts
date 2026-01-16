/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SubagentManager } from './subagents/subagent-manager.js';
import type { SkillManager } from './skills/skill-manager.js';
import { SubagentDetectionService } from './subagents/subagent-detection-service.js';
import type { SubagentConfig } from './subagents/types.js';
import type { SkillConfig } from './skills/types.js';

/**
 * Integration service that connects subagent and skill detection systems
 */
export class AgentSkillIntegrationService {
  private subagentDetectionService: SubagentDetectionService;

  constructor(
    private readonly subagentManager: SubagentManager,
    private readonly skillManager: SkillManager
  ) {
    this.subagentDetectionService = new SubagentDetectionService(this.subagentManager);
  }

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
    const subagentMatches = await this.subagentDetectionService.detectSubagents(taskDescription);
    const bestSubagentMatch = subagentMatches[0];

    // Check for skill matches using the skill manager
    const skillMatches = await this.findMatchingSkills(taskDescription);
    const bestSkillMatch = skillMatches[0];

    // Determine which is more confident
    const subagentConfidence = bestSubagentMatch ? bestSubagentMatch.confidence : 0;
    const skillConfidence = bestSkillMatch ? 0.8 : 0; // Assuming skill matches are high confidence

    if (subagentConfidence >= skillConfidence && bestSubagentMatch) {
      return {
        useSubagent: true,
        useSkill: false,
        subagent: bestSubagentMatch.config,
        confidence: subagentConfidence,
        reason: `Subagent "${bestSubagentMatch.config.name}" matches with confidence ${subagentConfidence.toFixed(2)}: ${bestSubagentMatch.reason}`
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
   * Finds matching skills for a task (using the skill manager)
   * In a real implementation, this would connect to the skill manager's detection capabilities
   */
  private async findMatchingSkills(taskDescription: string): Promise<SkillConfig[]> {
    // In a complete implementation, this would use the skillManager to find matching skills
    // For now, returning empty array - a full implementation would connect to skill detection
    // return await this.skillManager.findMatchingSkills(taskDescription);

    // For now, simulate skill matching by checking if any skills match the task description
    const allSkills = await this.skillManager.listSkills();
    const lowerTask = taskDescription.toLowerCase();

    const matchingSkills = allSkills.filter(skill => {
      const lowerDesc = skill.description.toLowerCase();
      const lowerName = skill.name.toLowerCase();

      // Check if task description matches skill name or description
      return lowerDesc.includes(lowerTask) || lowerTask.includes(lowerName);
    });

    return matchingSkills;
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