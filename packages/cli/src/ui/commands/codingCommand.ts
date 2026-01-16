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
import { getCodingContextMessage } from '@qwen-code/qwen-code-core';

export const codingCommand: SlashCommand = {
  name: 'coding',
  get description() {
    return t('Focus mode: Optimize for fast, focused implementation');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args?: string) => {
    const request = args?.trim() ?? '';

    if (!request) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(
            'Usage: /coding <your task>\nExample: /coding add user authentication',
          ),
        },
        Date.now(),
      );
      return;
    }

    const message = getCodingContextMessage(request);
    return {
      type: 'submit_prompt',
      content: [{ text: message }], // message contains context + user request
    };
  },
  completion: async (): Promise<CommandCompletionItem[]> => [
    {
      value: 'implement ',
      description: 'Add new feature or function',
    },
    {
      value: 'refactor ',
      description: 'Improve existing code structure',
    },
    {
      value: 'fix ',
      description: 'Implement a specific fix',
    },
    {
      value: 'test ',
      description: 'Write tests for a module',
    },
    {
      value: 'optimize ',
      description: 'Improve performance of code',
    },
  ],
};
