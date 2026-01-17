/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommandKind,
  type CommandCompletionItem,
  type CommandContext,
  type SlashCommand,
} from './types.js';
import { MessageType } from '../types.js';
import { t } from '../../i18n/index.js';
import {
  getMemoryInjectionService,
  getMemoryContextString,
} from '@qwen-code/qwen-code-core';

export const refreshMemoryCommand: SlashCommand = {
  name: 'refresh-memory',
  get description() {
    return t(
      'Refresh memory from decisions and bugs logs for current conversation context',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext) => {
    const memoryService = getMemoryInjectionService();

    // Refresh memory from disk
    const memory = await memoryService.refreshMemory();

    // Show status
    const summary = await memoryService.getMemorySummary();
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t(`🧠 Memory Refreshed - ${summary.status}`),
      },
      Date.now(),
    );

    // Get targeted reminder
    const reminder = await memoryService.getTargetedReminder();
    if (reminder) {
      context.ui.addItem(
        {
          type: MessageType.WARNING,
          text: t(reminder),
        },
        Date.now(),
      );
    }

    // Build memory context prompt
    const memoryPrompt = await memoryService.getMemoryInjectionPrompt();

    const contextString = getMemoryContextString(
      memory.recentDecisions,
      memory.knownBugs,
    );

    const message = `[MEMORY INJECTION]\n\n${memoryPrompt}\n\n---\n\n## Your Next Task\n${contextString}`;

    return {
      type: 'submit_prompt',
      content: [{ text: message }],
    };
  },
  completion: async (): Promise<CommandCompletionItem[]> => [
    {
      value: '',
      description: 'Refresh memory from logs',
    },
    {
      value: ' continue work',
      description: 'Continue with memory refreshed',
    },
    {
      value: ' check decisions',
      description: 'Review decisions after refresh',
    },
    {
      value: ' plan next steps',
      description: 'Plan next steps with memory context',
    },
  ],
};
