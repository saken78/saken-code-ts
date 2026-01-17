/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';
import { getDefinitionOfDoneService } from '@qwen-code/qwen-code-core';
import { MessageType } from '../types.js';

export const doneCommand: SlashCommand = {
  name: 'done',
  altNames: ['dod', 'validate'],
  get description() {
    return t('Validate Definition-of-Done criteria before shipping.');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context) => {
    const { ui } = context;
    const executionMode = context.executionMode ?? 'interactive';

    const dodService = getDefinitionOfDoneService();
    const report = await dodService.getValidationReport();

    if (executionMode === 'interactive') {
      ui.addItem(
        {
          type: MessageType.INFO,
          text: report,
        },
        Date.now(),
      );
      return;
    }

    if (executionMode === 'acp') {
      const messages = async function* () {
        yield {
          messageType: 'info' as const,
          content: report,
        };
      };

      return { type: 'stream_messages', messages: messages() };
    }

    return {
      type: 'message',
      messageType: 'info',
      content: report,
    };
  },
  get completion() {
    return [
      {
        value: '/done',
        description: 'Validate Definition-of-Done criteria',
      },
    ];
  },
};
