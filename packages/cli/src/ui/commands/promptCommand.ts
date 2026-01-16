/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';

export const promptCommand: SlashCommand = {
  name: 'prompt',
  get description() {
    return t('switch between different prompt modes (qwen, claude, combined)');
  },
  kind: CommandKind.BUILT_IN,
  action: (_context, args) => {
    const argsList = args ? args.trim().split(/\s+/) : [];

    if (argsList.length === 0) {
      return {
        type: 'message',
        messageType: 'info',
        content:
          'Current prompt mode: qwen\n\nAvailable modes: qwen, claude, combined\n\nUsage: /prompt [mode]\nExample: /prompt claude',
      };
    }

    const mode = argsList[0].toLowerCase();

    if (mode === 'qwen' || mode === 'claude' || mode === 'combined') {
      return {
        type: 'message',
        messageType: 'info',
        content: `Prompt mode switched to: ${mode}\n\nThe system prompt has been updated accordingly.`,
      };
    } else {
      return {
        type: 'message',
        messageType: 'error',
        content: `Invalid prompt mode: ${mode}\n\nAvailable modes: qwen, claude, combined\n\nUsage: /prompt [mode]\nExample: /prompt claude`,
      };
    }
  },
};
