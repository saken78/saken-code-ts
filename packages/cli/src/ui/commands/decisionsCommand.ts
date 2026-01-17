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
  getDocumentLoaderService,
  getLoadedDocumentsPrompt,
  getDocumentContextString,
} from '@qwen-code/qwen-code-core';

export const decisionsCommand: SlashCommand = {
  name: 'decisions',
  get description() {
    return t('Review architectural decisions from the project log');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext) => {
    const loaderService = getDocumentLoaderService();

    // Load decisions
    const decisionsContent = await loaderService.loadDecisionsContext();

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t('📋 Architectural Decisions Loaded'),
      },
      Date.now(),
    );

    const documentContext = getDocumentContextString({
      decisions: decisionsContent,
    });

    const message = getLoadedDocumentsPrompt(
      documentContext,
      "I have loaded the project's architectural decisions. Help me understand the reasoning behind these decisions and ensure any new work aligns with them. What questions do you have about these decisions?",
    );

    return {
      type: 'submit_prompt',
      content: [{ text: message }],
    };
  },
  completion: async (): Promise<CommandCompletionItem[]> => [
    {
      value: '',
      description: 'Review all architectural decisions',
    },
    {
      value: ' summarize',
      description: 'Get summary of key decisions',
    },
    {
      value: ' check alignment',
      description: 'Check if planned work aligns with decisions',
    },
    {
      value: ' find related',
      description: 'Find decisions related to a specific topic',
    },
    {
      value: ' update decision',
      description: 'Review or update a decision',
    },
  ],
};
