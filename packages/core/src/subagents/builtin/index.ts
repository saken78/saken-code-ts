/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { explorerAgent } from './explorer-agent.js';
import { plannerAgent } from './planner-agent.js';
import { reviewerAgent } from './reviewer-agent.js';
import { debuggerAgent } from './debugger-agent.js';
import { shadcnMigratorAgent } from './shadcn-migrator-agent.js';
import { contentAnalyzerAgent } from './content-analyzer-agent.js';
import { toolCreatorAgent } from './tool-creator-agent.js';
import { builtinAgentCreator } from './builtin-agent-creator-agent.js';
import { reactBestPractise } from './react-best-practise.js';
import { deepthinkAgent } from './deepthink-agent.js';
import { technicalResearcher } from './technical-researcher.js';
import { promptEngineerAgent } from './prompt-engineer-agent.js';
import { competitiveIntelligenceAnalystAgent } from './competitive-intelligence-analyst-agent.js';
import { researchOrchestratorAgent } from './research-orchestrator-agent.js';
import { queryClarifierAgent } from './query-clarifier-agent.js';
import { researchBriefGeneratorAgent } from './research-brief-generator-agent.js';
import { researchCoordinatorAgent } from './research-coordinator-agent.js';
import { academicResearcherAgent } from './academic-researcher-agent.js';
import { technicalResearcherAgent } from './technical-researcher-agent.js';
import { dataAnalystAgent } from './data-analyst-agent.js';
import { researchSynthesizerAgent } from './research-synthesizer-agent.js';
import { reportGeneratorAgent } from './report-generator-agent.js';
import type { SubagentConfig } from '../types.js';

/**
 * Registry of all built-in subagents
 */
export const builtinSubagents: Record<string, SubagentConfig> = {
  explorer: explorerAgent,
  planner: plannerAgent,
  reviewer: reviewerAgent,
  debugger: debuggerAgent,
  shadcnMigratorAgent,
  contentAnalyzerAgent,
  toolCreatorAgent,
  builtinAgentCreator,
  reactBestPractise,
  deepthinkAgent,
  technicalResearcher,
  'prompt-engineer': promptEngineerAgent,
  'competitive-intelligence-analyst': competitiveIntelligenceAnalystAgent,
  'research-orchestrator': researchOrchestratorAgent,
  'query-clarifier': queryClarifierAgent,
  'research-brief-generator': researchBriefGeneratorAgent,
  'research-coordinator': researchCoordinatorAgent,
  'academic-researcher': academicResearcherAgent,
  'technical-researcher': technicalResearcherAgent,
  'data-analyst': dataAnalystAgent,
  'research-synthesizer': researchSynthesizerAgent,
  'report-generator': reportGeneratorAgent,
};

/**
 * Gets a specific built-in subagent by name
 * @param name - The name of the subagent to retrieve
 * @returns The subagent configuration or undefined if not found
 */
export function getBuiltinSubagent(name: string): SubagentConfig | undefined {
  return builtinSubagents[name];
}

/**
 * Gets all built-in subagent configurations
 * @returns Array of all built-in subagent configurations
 */
export function getAllBuiltinSubagents(): SubagentConfig[] {
  return Object.values(builtinSubagents);
}

/**
 * Checks if a subagent name corresponds to a built-in subagent
 * @param name - The name to check
 * @returns True if the name corresponds to a built-in subagent, false otherwise
 */
export function isBuiltinSubagent(name: string): boolean {
  return name in builtinSubagents;
}
