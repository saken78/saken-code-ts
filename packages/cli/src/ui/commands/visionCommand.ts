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

export const visionCommand: SlashCommand = {
  name: 'vision',
  get description() {
    return t('Show project vision and boundaries from documentation');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext) => {
    const loaderService = getDocumentLoaderService();

    // Load vision context
    const visionContent = await loaderService.loadVisionContext();

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t('📋 Project Vision & Boundaries Loaded'),
      },
      Date.now(),
    );

    const documentContext = getDocumentContextString({
      vision: visionContent,
    });

    const message = getLoadedDocumentsPrompt(
      documentContext,
      'I have loaded the project vision and boundaries. Help me ensure all decisions align with these constraints. What clarifying questions do you have about scope and vision?',
    );

    return {
      type: 'submit_prompt',
      content: [{ text: message }],
    };
  },
  completion: async (): Promise<CommandCompletionItem[]> => [
    {
      value: '',
      description: 'Load and review project vision and boundaries',
    },
    {
      value: ' check alignment',
      description: 'Check if planned work aligns with vision',
    },
    {
      value: ' review assumptions',
      description: 'Review project assumptions and risks',
    },
  ],
};
