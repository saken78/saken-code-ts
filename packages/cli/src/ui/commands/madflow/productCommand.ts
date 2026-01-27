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

export const productCommand: SlashCommand = {
  name: 'mf:product',
  get description() {
    return t('Load product requirements and feature specifications');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext) => {
    const loaderService = getDocumentLoaderService();

    // Load product context
    const productContent = await loaderService.loadProductContext();

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t('📦 Product Requirements Loaded'),
      },
      Date.now(),
    );

    const documentContext = getDocumentContextString({
      product: productContent,
    });

    const message = getLoadedDocumentsPrompt(
      documentContext,
      'I have loaded the product requirements. Use these specifications to guide implementation and avoid hallucinating requirements. What features should I focus on next?',
    );

    return {
      type: 'submit_prompt',
      content: [{ text: message }],
    };
  },
  completion: async (): Promise<CommandCompletionItem[]> => [
    {
      value: '',
      description: 'Load product requirements document',
    },
    {
      value: ' feature ',
      description: 'Look up specific feature requirements',
    },
    {
      value: ' success criteria',
      description: 'Review success metrics and criteria',
    },
    {
      value: ' story ',
      description: 'Review user story',
    },
  ],
};
