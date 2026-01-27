/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ICommandLoader } from './types.js';
import type { SlashCommand } from '../ui/commands/types.js';
import type { Config } from '@qwen-code/qwen-code-core';
import { agentsCommand } from '../ui/commands/agentsCommand.js';
import { approvalModeCommand } from '../ui/commands/approvalModeCommand.js';
import { authCommand } from '../ui/commands/authCommand.js';
import { clearCommand } from '../ui/commands/clearCommand.js';
import { compressCommand } from '../ui/commands/compressCommand.js';
import { directoryCommand } from '../ui/commands/directoryCommand.js';
import { extensionsCommand } from '../ui/commands/extensionsCommand.js';
import { initCommand } from '../ui/commands/initCommand.js';
import { languageCommand } from '../ui/commands/languageCommand.js';
import { mcpCommand } from '../ui/commands/mcpCommand.js';
import { memoryCommand } from '../ui/commands/memoryCommand.js';
import { modelCommand } from '../ui/commands/modelCommand.js';
// import { permissionsCommand } from '../ui/commands/permissionsCommand.js';
import { quitCommand } from '../ui/commands/quitCommand.js';
import { restoreCommand } from '../ui/commands/restoreCommand.js';
import { resumeCommand } from '../ui/commands/resumeCommand.js';
import { settingsCommand } from '../ui/commands/settingsCommand.js';
import { statsCommand } from '../ui/commands/statsCommand.js';
import { summaryCommand } from '../ui/commands/summaryCommand.js';
import { themeCommand } from '../ui/commands/themeCommand.js';
import { toolsCommand } from '../ui/commands/toolsCommand.js';
import { setupGithubCommand } from '../ui/commands/setupGithubCommand.js';
import { codingCommand } from '../ui/commands/devflow/codingCommand.js';
import { debugCommand } from '../ui/commands/devflow/debugCommand.js';
import { reviewCommand } from '../ui/commands/devflow/reviewCommand.js';
import { designCommand } from '../ui/commands/devflow/designCommand.js';
import { visionCommand } from '../ui/commands/madflow/visionCommand.js';
import { productCommand } from '../ui/commands/madflow/productCommand.js';
import { progressCommand } from '../ui/commands/madflow/progressCommand.js';
import { refreshMemoryCommand } from '../ui/commands/refreshMemoryCommand.js';
import { decisionsCommand } from '../ui/commands/madflow/decisionsCommand.js';
import { bugsCommand } from '../ui/commands/madflow/bugsCommand.js';
import { phaseCommand } from '../ui/commands/madflow/phaseCommand.js';
import { doneCommand } from '../ui/commands/madflow/doneCommand.js';
import { skillsCommand } from '../ui/commands/skillsCommand.js';
import { agentCommand } from '../ui/commands/agentCommand.js';
// import { bugCommand } from '../ui/commands/bugCommand.js';
// import { helpCommand } from '../ui/commands/helpCommand.js';
// import { terminalSetupCommand } from '../ui/commands/terminalSetupCommand.js';

/**
 * Loads the core, hard-coded slash commands that are an integral part
 * of the Gemini CLI application.
 */
export class BuiltinCommandLoader implements ICommandLoader {
  constructor(private config: Config | null) {}

  /**
   * Gathers all raw built-in command definitions, injects dependencies where
   * needed (e.g., config) and filters out any that are not available.
   *
   * @param _signal An AbortSignal (unused for this synchronous loader).
   * @returns A promise that resolves to an array of `SlashCommand` objects.
   */
  async loadCommands(_signal: AbortSignal): Promise<SlashCommand[]> {
    const allDefinitions: Array<SlashCommand | null> = [
      agentsCommand,
      approvalModeCommand,
      authCommand,
      // bugCommand,
      clearCommand,
      compressCommand,
      directoryCommand,
      extensionsCommand,
      // helpCommand,
      initCommand,
      languageCommand,
      mcpCommand,
      memoryCommand,
      modelCommand,
      // ...(this.config?.getFolderTrust() ? [permissionsCommand] : []),
      quitCommand,
      restoreCommand(this.config),
      resumeCommand,
      statsCommand,
      summaryCommand,
      themeCommand,
      toolsCommand,
      settingsCommand,
      setupGithubCommand,
      codingCommand,
      debugCommand,
      reviewCommand,
      designCommand,
      visionCommand,
      productCommand,
      progressCommand,
      refreshMemoryCommand,
      decisionsCommand,
      bugsCommand,
      phaseCommand,
      doneCommand,
      ...(this.config?.getExperimentalSkills?.() ? [skillsCommand] : []),
      // terminalSetupCommand,
      agentCommand,
    ];

    return allDefinitions.filter((cmd): cmd is SlashCommand => cmd !== null);
  }
}
