# System Prompts Integration Guide

**Purpose:** Show how system prompts flow from claude-code-system-prompts into prompts.ts and influence LLM behavior.

**Reference:** `/claude-code-system-prompts/` and `packages/core/src/core/prompts.ts`

---

## System Prompts Architecture

### Three-Layer System

```
┌──────────────────────────────────────────────────────┐
│ Layer 1: External System Prompts                     │
│ /claude-code-system-prompts/system-prompts/          │
│                                                      │
│ - agent-prompt-*.md     (40+ agent prompts)         │
│ - tool-description-*.md (15+ tool descriptions)     │
│ - system-prompt-*.md    (10+ system behaviors)      │
│ - system-reminder-*.md  (3+ system reminders)       │
└────────────────────┬─────────────────────────────────┘
                     │ (reference & learn from)
                     ↓
┌──────────────────────────────────────────────────────┐
│ Layer 2: Custom Implementation Prompts              │
│ packages/core/src/prompts/features/                 │
│                                                      │
│ - agents-skills/index.ts    (HIGH PRIORITY agents) │
│ - [feature-name].ts         (Feature-specific)     │
│ - reminders/index.ts        (Dynamic reminders)    │
└────────────────────┬─────────────────────────────────┘
                     │ (imported & integrated)
                     ↓
┌──────────────────────────────────────────────────────┐
│ Layer 3: System Prompt Assembly (prompts.ts)       │
│ packages/core/src/core/prompts.ts                   │
│                                                      │
│ getCoreSystemPrompt():                             │
│ - Loads base prompt                                 │
│ - Imports AGENTS_SKILLS_PROMPT                     │
│ - Adds user memory                                  │
│ - Builds complete system instruction                │
└────────────────────┬─────────────────────────────────┘
                     │ (sent to model)
                     ↓
        ┌────────────────────┐
        │   Claude Model     │
        │   (follows prompt) │
        └────────────────────┘
```

---

## Reference External Prompts

### How to Reference

When implementing features, check `/claude-code-system-prompts/system-prompts/` for patterns:

```markdown
# Relevant System Prompts for Your Feature

## Agent Prompts (if creating subagent)

- agent-prompt-explore.md (516 tks)
  - Pattern: Navigation & discovery
  - Your use: [How to adapt for your feature]

## Tool Descriptions (if creating command)

- tool-description-bash.md (1125 tks)
  - Pattern: Clear instructions + examples
  - Your use: [How to structure your command prompt]

## System Prompts (if changing system behavior)

- system-prompt-main-system-prompt.md (2852 tks)
  - Pattern: Core mandates + tool list
  - Your use: [Where it fits in system behavior]
```

### File Structure

```
/claude-code-system-prompts/
├── README.md                 ← Overview & documentation
├── CHANGELOG.md              ← History of changes
│
└── system-prompts/
    ├── agent-prompt-*.md     (40+ files)
    │   └── Patterns: Clear instructions, examples, constraints
    │
    ├── tool-description-*.md (15+ files)
    │   └── Patterns: What tool does, when to use, examples
    │
    ├── system-prompt-*.md    (10+ files)
    │   └── Patterns: Behavior rules, integration points
    │
    └── system-reminder-*.md  (3+ files)
        └── Patterns: Context-specific reminders
```

### Token Count Consideration

Each prompt has a token count:

```
agent-prompt-explore.md (**516** tks)
tool-description-bash.md (**1125** tks)
system-prompt-main-system-prompt.md (**2852** tks)
```

When adding new prompts:

- Consider total context window impact
- Larger prompts (1000+ tokens) should be conditional
- Frequently-used prompts should be optimized

---

## Implementation: From Prompts.ts

### Current Integration (as of Jan 15, 2026)

```typescript
// packages/core/src/core/prompts.ts

import { AGENTS_SKILLS_PROMPT } from '../prompts/agents-skills/index.js';

export function getCoreSystemPrompt(
  userMemory?: string,
  model?: string,
): string {
  // 1. Load base prompt (or custom from QWEN_SYSTEM_MD)
  const basePrompt = systemMdEnabled
    ? fs.readFileSync(systemMdPath, 'utf8')
    : `
You are Qwen Code, an interactive CLI agent...

# Core Mandates
- Conventions: Follow existing patterns
- Libraries: Verify before using
- Style: Match surrounding code
- Comments: Why not what
...
    `;

  // 2. Add agents/skills section
  const agentsSection = `
\n\n## HIGH PRIORITY: Agents & Skills

${AGENTS_SKILLS_PROMPT}
  `;

  // 3. Add user memory if provided
  const memorySuffix = userMemory ? `\n\n---\n\n${userMemory.trim()}` : '';

  // 4. Return complete system instruction
  return basePrompt + agentsSection + memorySuffix;
}
```

### How prompts.ts Works

1. **Base Prompt:** Core instructions for Qwen Code behavior
2. **Conditional Sections:** Added based on flags/config
3. **Feature Prompts:** Imported and integrated
4. **User Memory:** Session-specific context
5. **Final Result:** Sent to model as system instruction

---

## Creating Feature Prompts

### Step 1: Understand Pattern

Check related prompts in `/claude-code-system-prompts/`:

```markdown
Example: Creating /validate-config command

Reference prompts:

- tool-description-bash.md - How to describe tools clearly
- agent-prompt-explore.md - How to guide agents
- system-prompt-main-system-prompt.md - System behavior pattern
```

### Step 2: Create Implementation Prompt

File: `packages/core/src/prompts/features/feature-name.ts`

```typescript
/**
 * Prompt for [Feature Name] feature.
 * Provides guidance to LLM about when and how to use this feature.
 *
 * References:
 * - /claude-code-system-prompts/tool-description-bash.md (pattern)
 * - /claude-code-system-prompts/agent-prompt-explore.md (agent pattern)
 */

export const FEATURE_NAME_PROMPT = `
# [Feature Name]

## Purpose
[One sentence describing what this does]

## When to Use
- Scenario 1: [Description]
- Scenario 2: [Description]

## How to Use
[Step-by-step or example usage]

## Key Constraints
- Constraint 1
- Constraint 2

## Examples
\`\`\`
Example 1: [Input/action and result]
\`\`\`

## Related Features
- [Related feature 1]
- [Related feature 2]
`;
```

### Step 3: Import into prompts.ts

In `packages/core/src/core/prompts.ts`:

```typescript
import { FEATURE_NAME_PROMPT } from '../prompts/features/feature-name.js';

export function getCoreSystemPrompt(
  userMemory?: string,
  model?: string,
): string {
  // ... existing code ...

  // Add feature section
  const featureSection = `
\n\n## Feature: [Name]\n
${FEATURE_NAME_PROMPT}
  `;

  return basePrompt + featureSection + memorySuffix;
}
```

### Step 4: Test Integration

```bash
# Build and verify no errors
npm run build

# Run LLM and check system message includes your prompt
# (Look in logs or debug output for system instruction)

# Verify LLM behavior follows your prompt's guidance
```

---

## Pattern Reference: Common Prompt Structures

### Pattern 1: Tool Description

_Reference: `/claude-code-system-prompts/tool-description-_.md`\*

```markdown
# Tool: [Name]

## Purpose

[What does it do]

## When to Use

[Scenarios where this is helpful]

## Syntax

[How to invoke it]

## Parameters

[List parameters and what they do]

## Examples

[Show usage examples]

## Important Notes

[Constraints, gotchas, best practices]
```

### Pattern 2: Agent Guidance

_Reference: `/claude-code-system-prompts/agent-prompt-_.md`\*

```markdown
# Agent: [Name]

## Goal

[What this agent tries to accomplish]

## Approach

[How to think about the problem]

## Key Instructions

1. [Instruction 1]
2. [Instruction 2]

## Examples

[Show what good looks like]

## When NOT to Use

[Cases where this agent shouldn't be used]
```

### Pattern 3: System Behavior

_Reference: `/claude-code-system-prompts/system-prompt-_.md`\*

```markdown
# [Behavior Category]

## Overview

[What this behavior category covers]

## Core Rules

1. [Rule 1]
2. [Rule 2]

## Implementation

[How to implement these rules]

## Edge Cases

[Special cases to handle]
```

---

## Integration Examples

### Example 1: Skills Command Feature

**From:** `/claude-code-system-prompts/system-prompts/`
**Reference:** tool-description-bash.md, agent-prompt-explore.md

**In:** `packages/core/src/prompts/features/skills-command.ts`

```typescript
export const SKILLS_COMMAND_PROMPT = `
# Skills Command

## Purpose
List and execute available skills in the system.

## Usage
- \`/skills\` - List all available skills
- \`/skills <name>\` - Execute specific skill

## Key Behavior
When a skill is invoked:
1. Verify skill exists
2. Load skill definition
3. Execute in user's context
4. Report results

## Constraints
- Only skills in .qwen/skills/ are available
- Custom skills override built-in skills
- Skills cannot modify CLI behavior
`;
```

**Then:** Import in prompts.ts and test that LLM uses /skills appropriately.

### Example 2: Multi-Provider Config

**From:** `/claude-code-system-prompts/system-prompts/`
**Reference:** system-prompt-main-system-prompt.md

**In:** `packages/core/src/prompts/features/multi-provider.ts`

```typescript
export const MULTI_PROVIDER_PROMPT = `
# Multi-Provider Configuration

## Supported Providers
- OpenAI (default: qwen3-coder-plus)
- Anthropic
- Gemini
- Vertex AI
- Qwen OAuth

## Configuration
Users can specify models per provider in settings:

\`\`\`json
{
  "modelProviders": {
    "openai": { "model": "custom-model" },
    "anthropic": { "model": "claude-3-opus" }
  }
}
\`\`\`

## When Using Each Provider
- OpenAI: Full tool support, streaming
- Anthropic: Limited tools, full context
- Gemini: Vision support, standard tools
- Qwen OAuth: Free tier, specialized models

## Important Notes
- Config precedence: L0 (runtime) > L1-L5 > L6 (defaults)
- OAuth tokens are managed dynamically
- Provider changes require refresh
`;
```

---

## Token Count Management

### Monitoring

```bash
# Check system prompt size
npm run build

# In TypeScript, measure prompt length:
const tokens = FEATURE_PROMPT.split(/\s+/).length * 1.3; // rough estimate
```

### Guidelines

- **Core system prompt:** Should stay under 3000 tokens (including all sections)
- **Feature prompts:** 100-500 tokens typical
- **Agent prompts:** 300-1000 tokens typical
- **Tool descriptions:** 100-500 tokens typical

### Optimization

If prompt is too large:

1. Move less critical info to examples
2. Use bullet points instead of prose
3. Abbreviate explanations
4. Consider making prompt conditional (only when needed)

---

## Workflow: Adding System Prompt to Feature

### 1. Research Phase

```bash
# Study related prompts
cat /claude-code-system-prompts/README.md
ls /claude-code-system-prompts/system-prompts/ | grep tool-description

# Find similar patterns
grep -l "similar-concept" /claude-code-system-prompts/system-prompts/*.md
```

### 2. Design Phase

```markdown
## Prompt Design for [Feature]

### Based on Patterns:

- Pattern 1 from [file].md
- Pattern 2 from [file].md

### Adapted for our use:

- [Customization 1]
- [Customization 2]

### Token Count Estimate:

- Base: ~200 tokens
- Examples: ~100 tokens
- Total: ~300 tokens
```

### 3. Implementation Phase

```typescript
// Create file: packages/core/src/prompts/features/[feature].ts

export const FEATURE_PROMPT = `
[Your prompt following the pattern]
`;
```

### 4. Integration Phase

```typescript
// Update: packages/core/src/core/prompts.ts

import { FEATURE_PROMPT } from '../prompts/features/[feature].js';

export function getCoreSystemPrompt(...) {
  // Add to result
  const featureSection = `\n\n## Feature: [Name]\n${FEATURE_PROMPT}`;
  return basePrompt + featureSection + memorySuffix;
}
```

### 5. Testing Phase

```bash
# Verify integration
npm run build
npm run type-check

# Test LLM follows prompt
qwen  # Start interactive session
# Verify feature behavior matches prompt guidance
```

### 6. Documentation Phase

```bash
# Add to feature-spec.md
- System prompt: `packages/core/src/prompts/features/[feature].ts`
- Pattern reference: `/claude-code-system-prompts/...`
- Token impact: ~300 tokens

# Add to implementation-log
- [x] System prompt created and integrated
- [x] Verified LLM behavior matches prompt
```

---

## Debugging System Prompts

### "LLM not following prompt guidance"

1. Check prompt was imported: `grep FEATURE_PROMPT packages/core/src/core/prompts.ts`
2. Check prompt is exported: `grep export packages/core/src/prompts/features/[feature].ts`
3. Verify prompt appears in system message:
   ```typescript
   const systemPrompt = getCoreSystemPrompt();
   console.log(systemPrompt); // Should include your section
   ```
4. Check prompt wording is clear and unambiguous

### "System prompt too long"

1. Measure: `wc -w packages/core/src/prompts/features/[feature].ts`
2. Review `/claude-code-system-prompts/` for more concise patterns
3. Move examples to separate file
4. Consider conditional inclusion

### "Unexpected prompt behavior"

1. Add to implementation-log what's happening
2. Check for conflicting prompts in the system
3. Review token context limit
4. Test in isolation with simplified prompt

---

## Best Practices

✅ **Do:**

- Follow patterns from `/claude-code-system-prompts/`
- Keep prompts concise and clear
- Include examples
- Document constraints
- Update system-state.md after changes

❌ **Don't:**

- Copy-paste large sections without understanding
- Create vague or ambiguous guidance
- Forget to import/integrate new prompts
- Leave old prompts in code
- Skip testing prompt integration

---

## Resources

- 📁 **System Prompts:** `/claude-code-system-prompts/system-prompts/`
- 📄 **Implementation:** `packages/core/src/core/prompts.ts`
- 📋 **Feature Workflow:** `docs/04-PROCESS/dev-workflow.md`
- 📝 **Feature Template:** `docs/02-FEATURES/FEATURE_TEMPLATE.md`

---

**Last Updated:** January 15, 2026
**Focus:** Integrating system prompts into Qwen Code development
**Goal:** Clear guidance for LLM on feature behavior
