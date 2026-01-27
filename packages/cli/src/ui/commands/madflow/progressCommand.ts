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
} from '../types.js';
import { MessageType } from '../../types.js';
import { t } from '../../../i18n/index.js';
import {
  getDocumentLoaderService,
  getLoadedDocumentsPrompt,
  getDocumentContextString,
} from '@qwen-code/qwen-code-core';

export const progressCommand: SlashCommand = {
  name: 'mf:progress',
  get description() {
    return t('Show implementation progress and completed work');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext) => {
    const loaderService = getDocumentLoaderService();

    // Load progress context
    const progressContent = await loaderService.loadProgressContext();

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t('📊 Implementation Progress Loaded'),
      },
      Date.now(),
    );

    const documentContext = getDocumentContextString({
      progress: progressContent,
    });

    const message = getLoadedDocumentsPrompt(
      documentContext,
      'I have loaded the implementation progress log. Review what has been completed and what work remains. What should I work on next based on current progress?',
    );

    return {
      type: 'submit_prompt',
      content: [{ text: message }],
    };
  },
  completion: async (): Promise<CommandCompletionItem[]> => [
    {
      value: '',
      description: 'Show implementation progress summary',
    },
    {
      value: ' summary',
      description: "Get summary of what's done vs remaining",
    },
    {
      value: ' what next',
      description: 'Ask what should be done next',
    },
    {
      value: ' blockers',
      description: 'Review any blockers or issues',
    },
  ],
};
