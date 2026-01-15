# Hybrid Prompt System Documentation

## Overview

The Qwen Code system now implements a hybrid prompt system that combines the best elements of both Qwen and Claude prompt architectures. This system enhances the core Qwen prompt with selected elements from Claude's more detailed and specialized prompt structures.

## Key Features

### 1. Enhanced Tool Descriptions

- More detailed instructions for each tool
- Better guidance for complex operations
- Improved error prevention through clearer guidelines

### 2. Specialized Agent Instructions

- Guidelines for creating and using specialized agents
- Best practices for task delegation
- Quality control measures for agent operations

### 3. Advanced System Reminders

- Operational constraints and safety measures
- Context awareness guidelines
- Consistency and integrity preservation

## Configuration Options

The system supports configurable prompt enhancement through the `CorePromptOptions` interface:

```typescript
interface CorePromptOptions {
  enableClaudeElements?: boolean; // Enable all Claude elements
  enableEnhancedToolDescriptions?: boolean; // Enhanced tool usage guidelines
  enableSpecializedAgents?: boolean; // Agent creation and usage guidelines
  enableAdvancedReminders?: boolean; // Advanced system reminders
}
```

## Implementation Details

### Core Integration

The hybrid system integrates Claude elements directly into the core Qwen prompt without requiring mode switching or complex configuration. This provides a seamless experience while enhancing capabilities.

### Backward Compatibility

All existing functionality is preserved. The system maintains full compatibility with existing workflows and configurations.

## Benefits

1. **Improved Tool Usage**: More detailed tool descriptions lead to better tool utilization
2. **Enhanced Agent Capabilities**: Better guidelines for agent creation and delegation
3. **Increased Safety**: Additional system reminders help maintain operational safety
4. **Simplified Architecture**: No need for complex mode switching systems

## Usage

The enhanced prompt system is enabled by default in all Qwen Code operations. No additional configuration is required for standard usage.

For custom configurations, the `getCoreSystemPrompt` function accepts optional parameters to control which Claude elements are included.
