/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Export all prompt-related functionality from a central location
export {
  getCoreSystemPrompt,
  getCustomSystemPrompt,
  getCompressionPrompt,
  getProjectSummaryPrompt,
  getSubagentSystemReminder,
  getPlanModeSystemReminder
} from './prompts.js';

// Export Claude prompt functionality
export {
  getCombinedSystemPrompt,
  getPromptMode,
  setPromptMode
} from './claude-prompts.js';

