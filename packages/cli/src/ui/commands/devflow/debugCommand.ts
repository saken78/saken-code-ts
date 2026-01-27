/**
 * @license
 * Copyright 2025 Qwen Team
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
import { getDebugContextMessage } from '@qwen-code/qwen-code-core';

export const debugCommand: SlashCommand = {
  name: 'saken:debug',
  get description() {
    return t('Enter debugging mode with enhanced context for troubleshooting.');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args?: string) => {
    const request = args?.trim() ?? '';

    if (!request) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(
            'Usage: /debug <issue description>\nExample: /debug getting timeout error in auth module',
          ),
        },
        Date.now(),
      );
      return;
    }

    const message = getDebugContextMessage(request);
    return {
      type: 'submit_prompt',
      content: [{ text: message }], // message contains context + user request
    };
  },
  completion: async (
    context: CommandContext,
    partialArg: string,
  ): Promise<CommandCompletionItem[]> => {
    // Provide basic completion options for common debugging contexts
    const commonDebugContexts = [
      { value: 'memory', description: t('Debug memory-related issues') },
      { value: 'performance', description: t('Debug performance problems') },
      { value: 'errors', description: t('Debug error handling') },
      { value: 'network', description: t('Debug network connectivity issues') },
      { value: 'authentication', description: t('Debug auth-related issues') },
    ];

    const normalizedPartial = partialArg.toLowerCase();
    return commonDebugContexts
      .filter((context) => context.value.startsWith(normalizedPartial))
      .map((context) => ({
        value: context.value,
        description: context.description,
      }));
  },
};
