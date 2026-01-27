/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  SlashCommand,
  CommandCompletionItem,
  CommandContext,
} from '../types.js';
import { CommandKind } from '../types.js';
import { t } from '../../../i18n/index.js';
import { getDefinitionOfDoneService } from '@qwen-code/qwen-code-core';
import { MessageType } from '../../types.js';

export const doneCommand: SlashCommand = {
  name: 'mf:done',
  altNames: ['dod', 'validate'],
  get description() {
    return t('Validate Definition-of-Done criteria before shipping.');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext) => {
    const dodService = getDefinitionOfDoneService();
    const report = await dodService.getValidationReport();

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: report,
      },
      Date.now(),
    );

    return {
      type: 'message',
      messageType: 'info',
      content: report,
    };
  },
  completion: async (): Promise<CommandCompletionItem[]> => [
    {
      value: 'done ',
      description: 'done workflow',
    },
  ],
};
