# Modular Prompt System Documentation

## Overview

The Qwen Code system now implements a modular prompt system that combines the best elements of both Qwen and Claude prompt architectures. This system enhances the core Qwen prompt with selected elements from Claude's more detailed and specialized prompt structures.

## Architecture

### Core Components

- `base-prompt.ts`: Contains the foundational Qwen Code system prompt
- `enhanced-elements.ts`: Adds Claude-inspired enhancements to the base prompt
- `tool-call-examples.ts`: Provides examples for tool usage

### Specialized Modules

- `tools/index.ts`: Detailed descriptions for each tool
- `agents/index.ts`: Specialized prompts for different agent types
- `reminders/index.ts`: System reminders for various operational modes

## Key Features

### 1. Configurable Enhancements

The system supports configurable prompt enhancement through the `CorePromptOptions` interface:

```typescript
interface CorePromptOptions {
  enableClaudeElements?: boolean; // Enable all Claude elements
  enableEnhancedToolDescriptions?: boolean; // Enhanced tool usage guidelines
  enableSpecializedAgents?: boolean; // Agent creation and usage guidelines
  enableAdvancedReminders?: boolean; // Advanced system reminders
  includeToolDescriptions?: string[]; // Specific tool descriptions to include
  includeAgentPrompts?: string[]; // Specific agent prompts to include
  includeSystemReminders?: string[]; // Specific system reminders to include
}
```

### 2. Dynamic Prompt Loading

The system can dynamically load specific prompt elements based on context:

- Load only relevant tool descriptions when specific tools are used
- Include agent prompts when agent functionality is needed
- Add system reminders for specific operational modes

### 3. Backward Compatibility

All existing functionality is preserved. The system maintains full compatibility with existing workflows and configurations.

## Benefits

1. **Improved Maintainability**: Modular structure makes it easier to update specific prompt elements
2. **Enhanced Flexibility**: Ability to customize prompt content based on context
3. **Better Performance**: Only load necessary prompt elements
4. **Scalability**: Easy to add new prompt modules without affecting existing functionality

## Usage

The enhanced prompt system is available through the standard `getCoreSystemPrompt` function with optional configuration:

```typescript
import { getCoreSystemPrompt } from '@qwen-code/qwen-code-core';

const prompt = getCoreSystemPrompt(userMemory, model, {
  enableClaudeElements: true,
  enableEnhancedToolDescriptions: true,
});
```

## Integration Points

The modular system integrates seamlessly with:

- Tool usage (provides detailed tool descriptions when needed)
- Agent functionality (adds specialized agent prompts)
- System reminders (includes contextual reminders)
- Existing workflows (maintains backward compatibility)
