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
import type { SubagentConfig } from '../types.js';

/**
 * Registry of all built-in subagents
 */
export const builtinSubagents: Record<string, SubagentConfig> = {
  explorer: explorerAgent,
  planner: plannerAgent,
  reviewer: reviewerAgent,
  debugger: debuggerAgent,
  'shadcn-migrator': shadcnMigratorAgent,
  'content-analyzer': contentAnalyzerAgent,
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
  return builtinSubagents.hasOwnProperty(name);
}