/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generic Agent Invocation Command
 * Allows invoking any subagent with: /agent {agentname} {prompt}
 * Used by middleware for automatic task routing
 */

import {
  CommandKind,
  type CommandCompletionItem,
  type CommandContext,
  type SlashCommand,
} from './types.js';
import { MessageType } from '../types.js';
import { t } from '../../i18n/index.js';
import { AsyncFzf } from 'fzf';
import type { SubagentConfig } from '@qwen-code/qwen-code-core';

export const agentCommand: SlashCommand = {
  name: 'agent',
  get description() {
    return t('Invoke a specific subagent: /agent {agentname} {prompt}');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args?: string) => {
    const fullArgs = (args ?? '').trim();

    if (!fullArgs) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(
            'Usage: /agent <agentname> <prompt>\n' +
              'Example: /agent explorer find all TypeScript files that import React\n' +
              'Available agents: explorer, debugger, reviewer, planner',
          ),
        },
        Date.now(),
      );
      return;
    }

    // Parse agent name and prompt
    // Format: "agentname prompt text here"
    const parts = fullArgs.split(/\s+/);
    const agentName = parts[0];
    const prompt = parts.slice(1).join(' ');

    if (!prompt) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(
            'Please provide a prompt after the agent name.\n' +
              'Example: /agent explorer find all TypeScript files',
          ),
        },
        Date.now(),
      );
      return;
    }

    const agentManager = context.services.config?.getSubagentManager();
    if (!agentManager) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: t('Could not retrieve agent manager.'),
        },
        Date.now(),
      );
      return;
    }

    const agents = await agentManager.listSubagents();
    if (agents.length === 0) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t('No agents are currently available.'),
        },
        Date.now(),
      );
      return;
    }

    // Validate agent name using fuzzy matching
    const hasAgent = agents.some(
      (agent) => agent.name.toLowerCase() === agentName.toLowerCase(),
    );

    if (!hasAgent) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(
            `Unknown agent: "${agentName}"\nAvailable agents: ${agents.map((agent) => agent.name).join(', ')}`,
          ),
        },
        Date.now(),
      );
      return;
    }

    // Submit prompt with agent context metadata
    // The Task tool will be invoked by the LLM with this context
    const agentContextMessage = `[SYSTEM: Execute this task using the ${agentName} subagent]\n\n${prompt}`;

    return {
      type: 'submit_prompt' as const,
      content: [{ text: agentContextMessage }],
    };
  },

  completion: async (
    context: CommandContext,
    partialArg: string,
  ): Promise<CommandCompletionItem[]> => {
    const agentManager = context.services.config?.getSubagentManager();
    if (!agentManager) {
      return [];
    }

    const agents = await agentManager.listSubagents();
    const normalizedPartial = partialArg.trim();
    const matches = await getAgentMatches(agents, normalizedPartial);

    return matches.map((agent) => ({
      value: agent.name,
      description: agent.description || t('No description available'),
    }));
  },
};

async function getAgentMatches(
  agents: SubagentConfig[],
  query: string,
): Promise<SubagentConfig[]> {
  if (!query) {
    return agents;
  }

  const names = agents.map((agent) => agent.name);
  const agentMap = new Map(agents.map((agent) => [agent.name, agent]));

  try {
    const fzf = new AsyncFzf(names, {
      fuzzy: 'v2',
      casing: 'case-insensitive',
    });
    const results = (await fzf.find(query)) as Array<{ item: string }>;
    return results
      .map((result) => agentMap.get(result.item))
      .filter((agent): agent is SubagentConfig => !!agent);
  } catch (error) {
    console.error('[agentCommand] Fuzzy match failed:', error);
    const lowerQuery = query.toLowerCase();
    return agents.filter((agent) =>
      agent.name.toLowerCase().startsWith(lowerQuery),
    );
  }
}
