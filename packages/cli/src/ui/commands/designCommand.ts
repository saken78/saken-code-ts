/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  SlashCommand,
  CommandContext,
  CommandCompletionItem,
} from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
import { MessageType } from '../types.js';
import { getDesignContextMessage } from '@qwen-code/qwen-code-core';

export const designCommand: SlashCommand = {
  name: 'design',
  get description() {
    return t(
      'Switch to design-focused mode with specialized prompts and context',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args?: string) => {
    const request = args?.trim() ?? '';

    if (!request) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(
            'Usage: /design <design task>\nExample: /design architecture for microservices',
          ),
        },
        Date.now(),
      );
      return;
    }

    const message = getDesignContextMessage(request);
    return {
      type: 'submit_prompt',
      content: [{ text: message }], // message contains context + user request
    };
  },
  completion: async (): Promise<CommandCompletionItem[]> => [
    {
      value: 'architecture ',
      description: 'Design system architecture',
    },
    {
      value: 'database ',
      description: 'Design database schema',
    },
    {
      value: 'api ',
      description: 'Design API structure',
    },
    {
      value: 'security ',
      description: 'Design security measures',
    },
    {
      value: 'ui/ux ',
      description: 'Design user interface/experience',
    },
  ],
};
