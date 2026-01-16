/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export function getMCPServerPrompts(config, serverName) {
  const promptRegistry = config.getPromptRegistry();
  if (!promptRegistry) {
    return [];
  }
  return promptRegistry.getPromptsByServer(serverName);
}

/**
 * Function to load Claude Code system prompts into the registry
 * This allows integration of Claude's extensive prompt library
 */
export { loadClaudePrompts } from './loadClaudePrompts.js';