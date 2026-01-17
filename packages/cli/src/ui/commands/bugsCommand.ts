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

export const bugsCommand: SlashCommand = {
  name: 'bugs',
  get description() {
    return t('Reference known bugs and learned lessons from the project log');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext) => {
    const loaderService = getDocumentLoaderService();

    // Load bugs
    const bugsContent = await loaderService.loadBugsContext();

    context.ui.addItem(
      {
        type: MessageType.WARNING,
        text: t('🐛 Known Bugs & Lessons Loaded'),
      },
      Date.now(),
    );

    const documentContext = getDocumentContextString({
      bugs: bugsContent,
    });

    const message = getLoadedDocumentsPrompt(
      documentContext,
      "I have loaded the project's known bugs and lessons learned. Help me avoid making the same mistakes. Before implementing code similar to these bug areas, reference the documented solutions. What patterns should I be aware of?",
    );

    return {
      type: 'submit_prompt',
      content: [{ text: message }],
    };
  },
  completion: async (): Promise<CommandCompletionItem[]> => [
    {
      value: '',
      description: 'Review known bugs and lessons',
    },
    {
      value: ' check similarity',
      description: 'Check if planned changes are similar to known bugs',
    },
    {
      value: ' prevent regression',
      description: 'Get guidance on preventing regressions',
    },
    {
      value: ' search topic ',
      description: 'Search bugs related to a topic',
    },
    {
      value: ' performance issues',
      description: 'Focus on performance-related bugs',
    },
    {
      value: ' security issues',
      description: 'Focus on security-related bugs',
    },
  ],
};
