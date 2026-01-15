# Claude Prompt Integration

## Overview

This document explains how Claude prompts are integrated into the Qwen Code system and how to use the prompt switching functionality.

## Features

- Loading Claude prompts from the `claude-code-system-prompts` directory
- Three prompt modes: `qwen`, `claude`, and `combined`
- Dynamic prompt switching via the `/prompt` command
- Integration with the existing system prompt architecture

## Usage

The system supports three different prompt modes:

1. `qwen` - Uses the standard Qwen Code system prompt
2. `claude` - Uses Claude-specific prompts only
3. `combined` - Combines Claude prompts with the standard Qwen prompt

## Implementation

The prompt switching functionality is implemented in `packages/core/src/core/prompts.ts` with the following key functions:

- `getCombinedSystemPrompt()` - Main function that returns the appropriate prompt based on mode
- `setPromptMode()` - Sets the current prompt mode
- `getPromptMode()` - Gets the current prompt mode
