/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 *
 * Priority Rules Enforcer
 * Converts text-based instructions into mandatory logic code with REQUIRED parameters.
 * These rules are enforced at the middleware/tool level, not just in prompts.
 */

/**
 * Priority Rule Definition - Each rule is CODE-BASED with REQUIRED parameters
 */
export interface PriorityRule {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: string;
  rule: string;
  enforcement: 'MIDDLEWARE' | 'TOOL' | 'PROMPT';
  requiredParameters: string[];
  description: string;
}

/**
 * All priority rules defined as CODE with mandatory enforcement
 */
export const PRIORITY_RULES: PriorityRule[] = [
  {
    id: 'PROMPT_ENGINEER_FIRST',
    priority: 'CRITICAL',
    category: 'Task Processing',
    rule: 'ALWAYS PROCESS USER PROMPTS THROUGH promptEngineerAgent FIRST',
    enforcement: 'MIDDLEWARE',
    requiredParameters: [
      'userPrompt: string (REQUIRED)',
      'config: Config (REQUIRED)',
      'timeout: number (REQUIRED, default 5000ms)',
    ],
    description:
      'Every user input must be optimized through PromptEngineer agent before further processing. This ensures high-quality prompts and reduces ambiguity.',
  },

  {
    id: 'SUBAGENT_FIRST',
    priority: 'CRITICAL',
    category: 'Agent Routing',
    rule: 'ALWAYS USE subagent FIRST before manual tools',
    enforcement: 'MIDDLEWARE',
    requiredParameters: [
      'taskType: TaskType (REQUIRED: "codebase-exploration" | "debugging" | "code-review" | "planning")',
      'confidence: number (REQUIRED, range 0-1)',
      'recommendedAgent: string (REQUIRED if confidence >= 0.3)',
    ],
    description:
      'When task type is detected with confidence >= 0.3, automatically delegate to specialized subagent instead of performing manual search/analysis.',
  },

  {
    id: 'NEVER_CREATE_UNNECESSARY_FILES',
    priority: 'CRITICAL',
    category: 'File Operations',
    rule: 'NEVER create files unless absolutely necessary',
    enforcement: 'TOOL',
    requiredParameters: [
      'filePath: string (REQUIRED, must be absolute)',
      'checkExists: boolean (REQUIRED, must check if file exists first)',
      'reason: string (REQUIRED, explain why file must be created)',
    ],
    description:
      'Before creating any file, check if it already exists. Only create if necessary. Use edit tool to modify existing files.',
  },

  {
    id: 'ABSOLUTE_PATHS_ALWAYS',
    priority: 'CRITICAL',
    category: 'Path Resolution',
    rule: 'Use absolute paths ALWAYS for all file operations',
    enforcement: 'TOOL',
    requiredParameters: [
      'filePath: string (REQUIRED)',
      'baseDir: string (REQUIRED if relative path detected)',
      'resolvedPath: string (REQUIRED, output)',
    ],
    description:
      'All file paths must be absolute. Relative paths are automatically resolved to absolute paths against project root or baseDir.',
  },

  {
    id: 'READ_BEFORE_EDIT',
    priority: 'CRITICAL',
    category: 'File Editing',
    rule: 'Read file BEFORE edit - dependency enforcement',
    enforcement: 'TOOL',
    requiredParameters: [
      'filePath: string (REQUIRED)',
      'isNewFile: boolean (REQUIRED)',
      'wasReadPreviously: boolean (REQUIRED, checked against access history)',
    ],
    description:
      'Existing files must be read via ReadFile tool BEFORE using Edit tool. This ensures understanding current content before modifications.',
  },

  {
    id: 'NO_URL_GUESSING',
    priority: 'CRITICAL',
    category: 'URL Handling',
    rule: 'NO guessing or generating URLs - whitelist only',
    enforcement: 'TOOL',
    requiredParameters: [
      'url: string (REQUIRED)',
      'isUserProvided: boolean (REQUIRED)',
      'isWhitelisted: boolean (REQUIRED, checked against whitelist)',
    ],
    description:
      'Only use URLs from whitelist or explicitly provided by user. Never generate or guess URLs. Default whitelist: github.com, npmjs.com, nodejs.org, typescript.org, react.dev, angular.io, vue.js, docs.*, api.*',
  },

  {
    id: 'DEPRECATED_COMMANDS_BLOCKED',
    priority: 'HIGH',
    category: 'Tool Usage',
    rule: 'Use modern tools instead of deprecated bash commands',
    enforcement: 'TOOL',
    requiredParameters: [
      'command: string (REQUIRED, bash command to execute)',
      'blockedCommands: string[] (REQUIRED: ["ls", "grep", "find", "cat", "head", "tail"])',
    ],
    description:
      'Block deprecated bash commands and force use of tool alternatives: ls→EZA, grep→RIPGREP, find→FD, cat→BAT',
  },

  {
    id: 'PARALLEL_EXECUTION',
    priority: 'HIGH',
    category: 'Execution Strategy',
    rule: 'Run independent operations in parallel',
    enforcement: 'MIDDLEWARE',
    requiredParameters: [
      'operations: Operation[] (REQUIRED)',
      'dependencies: Map<Op, Op[]> (REQUIRED, defines dependencies)',
      'parallel: Operation[] (output, independent operations)',
      'sequential: Operation[] (output, dependent operations)',
    ],
    description:
      'Analyze operation dependencies: Independent operations→run in parallel. Dependent operations→chain sequentially with && or use sequential calls.',
  },

  {
    id: 'NO_RANDOM_FILE_CREATION',
    priority: 'HIGH',
    category: 'File Operations',
    rule: 'ALWAYS prefer editing existing files over creating new ones',
    enforcement: 'PROMPT',
    requiredParameters: [
      'fileType: string (REQUIRED: ".md", ".json", ".config", etc)',
      'exists: boolean (REQUIRED)',
      'editReason: string (OPTIONAL, if editing)',
    ],
    description:
      'For markdown, JSON, config files: edit existing instead of creating new. Only create if no template exists.',
  },

  {
    id: 'TASK_MANAGEMENT',
    priority: 'HIGH',
    category: 'Task Tracking',
    rule: 'Use TODO_WRITE tool for all multi-step tasks',
    enforcement: 'MIDDLEWARE',
    requiredParameters: [
      'taskCount: number (REQUIRED)',
      'isComplex: boolean (REQUIRED, 3+ steps = complex)',
      'todoItems: Todo[] (REQUIRED)',
    ],
    description:
      'Complex tasks (3+ steps) MUST use TodoWrite tool. Mark tasks in_progress BEFORE work, completed IMMEDIATELY after.',
  },

  {
    id: 'VERIFY_BEFORE_PROCEEDING',
    priority: 'HIGH',
    category: 'Verification',
    rule: 'Verify assumptions with tools before proceeding',
    enforcement: 'PROMPT',
    requiredParameters: [
      'assumption: string (REQUIRED)',
      'tool: string (REQUIRED, verification tool to use)',
      'verified: boolean (REQUIRED, must be true before proceeding)',
    ],
    description:
      'Never assume file contents, paths, APIs, or URLs. Verify with tools first: file contents→Read, existence→EZA/FD, APIs→read source, config→read file.',
  },
];

/**
 * Enforcement configuration for each rule
 */
export interface RuleEnforcement {
  ruleId: string;
  validatorFn: (params: Record<string, unknown>) => {
    isValid: boolean;
    message?: string;
    violationType?: 'CRITICAL' | 'WARNING';
  };
  blockExecution?: boolean;
  logLevel?: 'error' | 'warn' | 'info';
}

/**
 * Get rule enforcement details
 */
export function getRuleEnforcement(ruleId: string): PriorityRule | undefined {
  return PRIORITY_RULES.find((r) => r.id === ruleId);
}

/**
 * Get all critical rules
 */
export function getCriticalRules(): PriorityRule[] {
  return PRIORITY_RULES.filter((r) => r.priority === 'CRITICAL');
}

/**
 * Get rules by enforcement type
 */
export function getRulesByEnforcement(
  enforcementType: 'MIDDLEWARE' | 'TOOL' | 'PROMPT',
): PriorityRule[] {
  return PRIORITY_RULES.filter((r) => r.enforcement === enforcementType);
}

/**
 * Generate priority rules section for basePrompt
 * Converts rules to human-readable format with enforcement details
 */
export function generatePriorityRulesPromptSection(): string {
  const criticalRules = getCriticalRules();

  let section = `# 🚨 MANDATORY PRIORITY RULES - CODE ENFORCED 🚨

These rules are ENFORCED AT CODE LEVEL (middleware/tools), not just text instructions.
Violations will be caught and rejected at runtime.

## Critical Priority Rules (ALWAYS ENFORCED)

`;

  for (const rule of criticalRules) {
    section += `### ${rule.rule}
**Enforcement:** ${rule.enforcement} Level (${rule.priority} Priority)
**Required Parameters:**
${rule.requiredParameters.map((p) => `- ${p}`).join('\n')}
**Details:** ${rule.description}

`;
  }

  section += `## Rule Enforcement

All priority rules are ENFORCED through:

1. **MIDDLEWARE Enforcement** - Intercepts input/output, validates against rules before execution
2. **TOOL Enforcement** - Built into tool invocation, validates parameters before operation
3. **PROMPT Enforcement** - Documented here; used to guide AI behavior when code enforcement not possible

## What This Means

Instead of text instructions you might skip:
- ❌ "You should use ReadFile before Edit" → ✅ Edit tool BLOCKS if file not read first
- ❌ "Try to use absolute paths" → ✅ Path validation AUTO-CONVERTS relative→absolute
- ❌ "Avoid creating files unnecessarily" → ✅ WriteFile tool REJECTS creation if file exists
- ❌ "Use modern tools like EZA" → ✅ Bash tool BLOCKS deprecated commands (ls, grep, find)
- ❌ "Don't guess URLs" → ✅ URL validator BLOCKS non-whitelisted URLs

## Enforcement Violations

If a violation occurs:
- **CRITICAL violations** → Tool call REJECTED, error returned to user
- **Enforcement triggered** → Clear error message explaining the rule and how to comply
- **No exceptions** → Rules apply consistently regardless of context
`;

  return section;
}

/**
 * Generate enforcement reference for developers
 */
export function generateEnforcementReference(): string {
  const rules = PRIORITY_RULES;

  const reference = `# Priority Rules Enforcement Reference

Total Rules: ${rules.length}
Critical: ${rules.filter((r) => r.priority === 'CRITICAL').length}
High: ${rules.filter((r) => r.priority === 'HIGH').length}

## By Enforcement Type

### Middleware Enforcement (${rules.filter((r) => r.enforcement === 'MIDDLEWARE').length} rules)
${rules
  .filter((r) => r.enforcement === 'MIDDLEWARE')
  .map((r) => `- ${r.id}: ${r.rule}`)
  .join('\n')}

### Tool Enforcement (${rules.filter((r) => r.enforcement === 'TOOL').length} rules)
${rules
  .filter((r) => r.enforcement === 'TOOL')
  .map((r) => `- ${r.id}: ${r.rule}`)
  .join('\n')}

### Prompt Enforcement (${rules.filter((r) => r.enforcement === 'PROMPT').length} rules)
${rules
  .filter((r) => r.enforcement === 'PROMPT')
  .map((r) => `- ${r.id}: ${r.rule}`)
  .join('\n')}

## Implementation Status

| Rule ID | Status | Implemented | Location |
|---------|--------|-------------|----------|
| PROMPT_ENGINEER_FIRST | ✅ ACTIVE | Yes | packages/core/src/core/prompt-engineer-middleware.ts |
| SUBAGENT_FIRST | ✅ ACTIVE | Yes | packages/core/src/core/subagent-router.ts |
| NEVER_CREATE_UNNECESSARY_FILES | ✅ ACTIVE | Yes | packages/core/src/tools/validation-wrapper.ts (Priority 4) |
| ABSOLUTE_PATHS_ALWAYS | ✅ ACTIVE | Yes | packages/core/src/tools/validation-wrapper.ts (Priority 5) |
| READ_BEFORE_EDIT | ✅ ACTIVE | Yes | packages/core/src/tools/file-access-validation.ts |
| NO_URL_GUESSING | ✅ ACTIVE | Yes | packages/core/src/tools/validation-wrapper.ts (Priority 7) |
| DEPRECATED_COMMANDS_BLOCKED | ✅ ACTIVE | Yes | packages/core/src/utils/deprecated-command-validator.ts |
| PARALLEL_EXECUTION | ⏳ PARTIAL | Text only | prompts.ts (need code enforcer) |
| NO_RANDOM_FILE_CREATION | ✅ ACTIVE | Yes | packages/core/src/tools/validation-wrapper.ts (Priority 4) |
| TASK_MANAGEMENT | ⏳ PARTIAL | Text only | prompts.ts (need validation) |
| VERIFY_BEFORE_PROCEEDING | ⏳ PARTIAL | Text only | prompts.ts (need enforcer) |
`;

  return reference;
}

/**
 * Export all rules for reference
 */
export function exportRulesAsMarkdown(): string {
  let markdown = `# Priority Rules - Complete Reference

Generated: ${new Date().toISOString()}

## Summary

Total Enforced Rules: ${PRIORITY_RULES.length}
- Critical (ALWAYS ENFORCED): ${PRIORITY_RULES.filter((r) => r.priority === 'CRITICAL').length}
- High (ENFORCED): ${PRIORITY_RULES.filter((r) => r.priority === 'HIGH').length}

## All Rules

`;

  for (const rule of PRIORITY_RULES) {
    markdown += `### ${rule.priority}: ${rule.rule}
- **ID:** ${rule.id}
- **Category:** ${rule.category}
- **Enforcement Level:** ${rule.enforcement}
- **Description:** ${rule.description}
- **Required Parameters:**
  ${rule.requiredParameters.map((p) => `- ${p}`).join('\n  ')}

`;
  }

  return markdown;
}
