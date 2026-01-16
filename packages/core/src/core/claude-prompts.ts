/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCoreSystemPrompt } from './prompts.js';

// Module-level state for prompt mode
let currentPromptMode: 'qwen' | 'claude' | 'combined' = 'qwen';

/**
 * Get the current prompt mode
 * @returns Current prompt mode: 'qwen', 'claude', or 'combined'
 */
export function getPromptMode(): 'qwen' | 'claude' | 'combined' {
  return currentPromptMode;
}

/**
 * Set the prompt mode
 * @param mode - The mode to set: 'qwen', 'claude', or 'combined'
 */
export function setPromptMode(
  mode: 'qwen' | 'claude' | 'combined',
): void {
  if (!['qwen', 'claude', 'combined'].includes(mode)) {
    throw new Error(`Invalid prompt mode: ${mode}`);
  }
  currentPromptMode = mode;
}

/**
 * Function to load and combine Claude prompts with the main system prompt
 * @param userMemory - Optional user memory to include in the prompt
 * @param promptMode - The mode to use: 'qwen', 'claude', or 'combined'. If not provided, uses the current mode
 * @returns The combined system prompt based on the selected mode
 */
export async function getCombinedSystemPrompt(
  userMemory?: string,
  promptMode?: 'qwen' | 'claude' | 'combined',
): Promise<string> {
  // Use provided mode or get current mode
  const mode = promptMode || getPromptMode();

  const corePrompt = getCoreSystemPrompt(userMemory);

  if (mode === 'qwen') {
    return corePrompt;
  }

  // For Claude mode, load Claude prompts dynamically
  if (mode === 'claude' || mode === 'combined') {
    try {
      // Import dynamically to avoid circular dependencies
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loadClaudePromptsModule = await import(
        '../prompts/loadClaudePrompts.js'
      ) as any;
      const { PromptRegistry } = await import('../prompts/prompt-registry.js');

      const promptRegistry = new PromptRegistry();
      await loadClaudePromptsModule.loadClaudePrompts(promptRegistry);

      // Get all prompts from the registry and filter for claude-prompt type
      const allPrompts = promptRegistry.getAllPrompts();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const claudePrompts = allPrompts.filter((p: any) => p.type === 'claude-prompt');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const claudePromptText = claudePrompts
        .map((prompt: any) => prompt.content || prompt.text || '')
        .filter((text: string) => text.length > 0)
        .join('\n\n');

      if (mode === 'claude') {
        return claudePromptText || corePrompt;
      }

      // Combined mode: Claude prompts first, then core Qwen prompt
      if (claudePromptText) {
        return claudePromptText + '\n\n' + corePrompt;
      }
      return corePrompt;
    } catch (error) {
      console.warn(
        'Failed to load Claude prompts, falling back to Qwen prompt:',
        error,
      );
      return corePrompt;
    }
  }

  return corePrompt;
}
