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
import { getReviewContextMessage } from '@qwen-code/qwen-code-core';

/**
 * /review command - Advanced code review with contextual awareness
 * Usage: /review analyze src/auth.ts for security vulnerabilities
 */
export const reviewCommand: SlashCommand = {
  name: 'review',
  get description() {
    return t(
      'Advanced code review: Analyze code quality, security, and performance',
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
            'Usage: /review <code to analyze>\nExample: /review @src/auth.ts for security and performance',
          ),
        },
        Date.now(),
      );
      return;
    }

    const message = getReviewContextMessage(request);
    return {
      type: 'submit_prompt',
      content: [{ text: message }], // message contains context + user request
    };
  },
  completion: async (): Promise<CommandCompletionItem[]> => [
    {
      value: '@',
      description: 'Reference a file for review',
    },
    {
      value: 'for security ',
      description: 'Focus on security vulnerabilities',
    },
    {
      value: 'for performance ',
      description: 'Focus on performance optimization',
    },
    {
      value: 'for maintainability ',
      description: 'Focus on code maintainability',
    },
    {
      value: 'for accessibility ',
      description: 'Focus on accessibility compliance',
    },
    {
      value: 'for best practices ',
      description: 'Check against coding best practices',
    },
  ],
};
