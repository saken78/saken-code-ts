/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// Import the functions from the Claude prompts module
import {
  getCombinedSystemPrompt,
  setPromptMode,
  getPromptMode
} from '@qwen-code/qwen-code-core/src/core/claude-prompts.js';

/**
 * Handler for the /prompt command that allows switching between different prompt modes
 * including Qwen, Claude, and combined modes.
 */
export async function handlePromptCommand(args: string[]): Promise<string> {
  if (args.length === 0) {
    return `Current prompt mode: ${getPromptMode()}\n\nAvailable modes: qwen, claude, combined\n\nUsage: /prompt [mode]\nExample: /prompt claude`;
  }

  const mode = args[0].toLowerCase();

  if (mode === 'qwen' || mode === 'claude' || mode === 'combined') {
    setPromptMode(mode);

    // Regenerate the system prompt based on the new mode
    await getCombinedSystemPrompt(undefined, mode as 'qwen' | 'claude' | 'combined');

    return `Prompt mode switched to: ${mode}\n\nThe system prompt has been updated accordingly.`;
  } else {
    return `Invalid prompt mode: ${mode}\n\nAvailable modes: qwen, claude, combined\n\nUsage: /prompt [mode]\nExample: /prompt claude`;
  }
}
