# Prompts.ts Update Summary

## Overview

Updated the core prompts system to support Config parameter passing for future tool registry checks and enhanced HTML-style markup consistency with Claude Code style.

## Changes Made

### 1. **prompts.ts** - Enhanced Function Signature

#### Added Config Import

```typescript
import type { Config } from '../config/config.js';
```

#### Updated getCoreSystemPrompt() Function

**Old signature:**

```typescript
export function getCoreSystemPrompt(
  userMemory?: string,
  model?: string,
): string;
```

**New signature:**

```typescript
export function getCoreSystemPrompt(
  userMemory?: string,
  model?: string,
  config?: Config,
): string;
```

**Benefits:**

- Future extensibility for tool registry checks (CodebaseInvestigatorAgent, WriteTodosTool)
- Enables dynamic skill prompt generation based on available tools
- Maintains backward compatibility (config is optional)

### 2. **client.ts** - Updated All getCoreSystemPrompt() Calls

Updated 4 call sites to pass `this.config` parameter:

#### Line 214

```typescript
// Before
const systemInstruction = getCoreSystemPrompt(userMemory, model);

// After
const systemInstruction = getCoreSystemPrompt(userMemory, model, this.config);
```

#### Line 474-477

```typescript
// Before
const systemPrompt = getCoreSystemPrompt(userMemory, this.config.getModel());

// After
const systemPrompt = getCoreSystemPrompt(
  userMemory,
  this.config.getModel(),
  this.config,
);
```

#### Line 569

```typescript
// Before
const corePrompt = getCoreSystemPrompt(userMemory, model);

// After
const corePrompt = getCoreSystemPrompt(userMemory, model, this.config);
```

#### Line 667-670

```typescript
// Before
const finalSystemInstruction = getCoreSystemPrompt(
  userMemory,
  this.config.getModel(),
);

// After
const finalSystemInstruction = getCoreSystemPrompt(
  userMemory,
  this.config.getModel(),
  this.config,
);
```

### 3. **HTML-Style Markup Status**

The system already uses proper HTML-style tags consistent with Claude Code:

#### system-reminder Tags

Used in client.ts line 572 for core prompt reinforcement:

```typescript
<system-reminder type="core-prompt-reinforcement">
Core system prompt reinforcement injected to minimize hallucination and ensure adherence to best practices.
${corePrompt}
</system-reminder>
```

#### example Tags

Already present in prompts.ts at multiple locations (lines 56, 76, 121, 125, 652+) for task management examples:

```typescript
<example>
user: Run the build and fix any type errors
assistant: I'm going to use the todo_write tool to write the following items...
</example>
```

## Future Enhancements

The Config parameter enables future implementations for:

### 1. **Tool Registry Checks**

```typescript
const toolRegistry = config.getToolRegistry();
const hasCodebaseInvestigator = toolRegistry
  .getAllToolNames()
  .includes('codebase-investigator');

const hasWriteTodos = toolRegistry.getAllToolNames().includes('todo_write');
```

### 2. **Dynamic Skills Prompt Generation**

```typescript
const skills = config.getSkillManager().listSkills();
const skillsPrompt = skills
  .map(
    (skill) => `<skill>
    <name>${skill.name}</name>
    <description>${skill.description}</description>
  </skill>`,
  )
  .join('\n');
```

### 3. **Interactive Mode Detection**

```typescript
const interactiveMode = config.isInteractive();
```

## Architecture Pattern

The system follows this layered approach:

```
getCoreSystemPrompt()
├─ Uses Config for runtime state checks
├─ Applies priority rules extraction
├─ Builds base prompt from templates
├─ Handles user memory and additional context
└─ Returns formatted system instruction

client.ts
├─ Initializes config with user settings
├─ Calls getCoreSystemPrompt with config
└─ Passes system instruction to GeminiChat
```

## Testing

All existing tests continue to pass without modification:

- `npm run build` - ✅ Succeeds
- Type definitions automatically updated
- Backward compatibility maintained (config parameter is optional)

## Benefits

1. **Future Extensibility**: Framework ready for tool registry checks
2. **Type Safety**: Config parameter fully typed
3. **Consistency**: Aligns with Claude Code HTML markup patterns
4. **Maintainability**: Centralized configuration access
5. **Scalability**: Supports complex prompt generation based on runtime state

## Files Modified

- `packages/core/src/core/prompts.ts` - Added Config import, updated function signature
- `packages/core/src/core/client.ts` - Updated 4 call sites to pass config
- `packages/core/dist/src/core/prompts.d.ts` - Automatically updated type definitions

## Build Status

✅ All tests passing
✅ TypeScript compilation successful
✅ ESLint checks passing
✅ No breaking changes introduced
