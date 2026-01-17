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
  getPhaseDetectionService,
  getPhaseContextMessage,
  getPhaseDescription,
  getPhaseEmoji,
} from '@qwen-code/qwen-code-core';

export const phaseCommand: SlashCommand = {
  name: 'phase',
  get description() {
    return t(
      'Switch project phase (plan/dev/review/release) for context-aware guidance',
    );
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args?: string) => {
    const phaseService = getPhaseDetectionService();

    const phaseArg = args?.trim().toLowerCase() as
      | 'plan'
      | 'dev'
      | 'review'
      | 'release'
      | undefined;

    // If no phase specified, show current phase and options
    if (!phaseArg) {
      const currentPhase = phaseService.getCurrentPhase();
      const detection = await phaseService.detectPhase();

      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(
            `📊 Current Phase: ${getPhaseEmoji(currentPhase)} ${currentPhase.toUpperCase()}\n\n${getPhaseDescription(currentPhase)}\n\nDetection: ${detection.reason} (confidence: ${(detection.confidence * 100).toFixed(0)}%)`,
          ),
        },
        Date.now(),
      );

      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(
            'Available phases: /phase plan | /phase dev | /phase review | /phase release',
          ),
        },
        Date.now(),
      );

      return;
    }

    // Validate phase
    const validPhases: Array<'plan' | 'dev' | 'review' | 'release'> = [
      'plan',
      'dev',
      'review',
      'release',
    ];
    if (!validPhases.includes(phaseArg)) {
      context.ui.addItem(
        {
          type: MessageType.WARNING,
          text: t(
            `Invalid phase: ${phaseArg}. Valid phases: plan, dev, review, release`,
          ),
        },
        Date.now(),
      );
      return;
    }

    // Set phase
    phaseService.setPhase(phaseArg);

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t(
          `🔄 Switched to ${getPhaseEmoji(phaseArg)} ${phaseArg.toUpperCase()} Phase\n\n${getPhaseDescription(phaseArg)}`,
        ),
      },
      Date.now(),
    );

    // Create phase context message
    const message = getPhaseContextMessage(
      phaseArg,
      `I have switched to ${phaseArg.toUpperCase()} phase. Please adapt your approach accordingly. I'm ready to focus on the priorities for this phase.`,
    );

    return {
      type: 'submit_prompt',
      content: [{ text: message }],
    };
  },
  completion: async (): Promise<CommandCompletionItem[]> => [
    {
      value: 'plan',
      description: 'Planning: Requirements, architecture, scope',
    },
    {
      value: 'dev',
      description: 'Development: Implementation, testing, quality',
    },
    {
      value: 'review',
      description: 'Review: Code quality, security, performance',
    },
    {
      value: 'release',
      description: 'Release: Stability, documentation, deployment',
    },
  ],
};
