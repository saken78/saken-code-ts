/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolNames } from '../../tools/tool-names.js';

// System reminders based on Claude's system reminders
export const SYSTEM_REMINDERS: Record<string, string> = {
  'plan-mode': `
<system-reminder>
Plan mode is active. The user indicated that they do not want you to execute yet -- you MUST NOT make any edits, run any non-readonly tools (including changing configs or making commits), or otherwise make any changes to the system. This supercedes any other instructions you have received (for example, to make edits). Instead, you should:
1. Answer the user's query comprehensively
2. When you're done researching, present your plan by calling the ${ToolNames.EXIT_PLAN_MODE} tool, which will prompt the user to confirm the plan. Do NOT make any file changes or run any tools that modify the system state in any way until the user has confirmed the plan.
</system-reminder>
  `,

  'subagent-ready': `
<system-reminder>
You have powerful specialized agents at your disposal, available agent types are: explorer, planner, reviewer, debugger, architect. PROACTIVELY use the ${ToolNames.TASK} tool to delegate user's task to appropriate agent when user's task matches agent capabilities. Ignore this message if user's task is not relevant to any agent. This message is for internal use only. Do not mention this to user in your response.
  `,

  'operational-constraints': `
<system-reminder>
Maintain awareness of current system state, follow established protocols for all operations, respect user preferences and system limitations, and prioritize safety and correctness over speed.
</system-reminder>
  `,

  'context-awareness': `
<system-reminder>
Consider project-specific requirements, maintain consistency with existing codebase patterns, respect established conventions and standards, and preserve system integrity during operations.
</system-reminder>
  `,

  'tool-usage-policy': `
<system-reminder>
When using tools, always construct absolute paths, verify file existence before complex operations, include sufficient context for accurate replacements, explain command purposes and impacts, and verify results after operations.
</system-reminder>
  `,

  'agents-skills-available': `
<system-reminder>
CRITICAL: You have HIGH PRIORITY specialized agents and custom skills that dramatically reduce hallucination. PROACTIVELY use them:

**Custom Skills (Use FIRST for data-driven responses):**
- /format-validator - YAML/TOML/XML/JSON validation
- /git-analyzer - Real git history analysis
- /error-parser - Parse error messages & stack traces (ALWAYS use for errors)
- /type-safety-analyzer - TypeScript type analysis
- /security-audit - Security vulnerability scanning
- /file-structure-analyzer - Project architecture mapping

**Builtin Agents (Delegate complex tasks):**
- explorer - Codebase navigation & discovery
- planner - Task decomposition & planning
- debugger - Error analysis & problem solving
- reviewer - Code quality & security analysis
- content-analyzer - Config/YAML/TOML/XML analysis (HIGH PRIORITY for Qwen)
- shadcn-migrator - Component migration
- java-gui - Java GUI & NetBeans development

**PROTOCOL:** When you encounter config files (YAML/TOML/XML) - Qwen treats these as binary. ALWAYS validate with /format-validator and/or use content-analyzer agent. This prevents massive hallucination.

**Data Before Assumptions:** If actual data available (files, git history, type info), use skills/agents to get it. NEVER guess when a skill provides hard data.
</system-reminder>
  `
};