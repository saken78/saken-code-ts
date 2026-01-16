/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PromptRegistry } from './prompt-registry.js';

/**
 * Loads Claude Code system prompts from the claude-code-system-prompts directory
 * and registers them with the PromptRegistry
 */
export function loadClaudePrompts(promptRegistry: PromptRegistry): Promise<void>;
