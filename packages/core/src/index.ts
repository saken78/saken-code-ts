/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Export config
export * from './config/config.js';
export * from './output/types.js';
export * from './output/json-formatter.js';

// Export context commands for focused work modes
export * from './prompts/context-commands/coding-context.js';
export * from './prompts/context-commands/debug-context.js';
export * from './prompts/context-commands/review-context.js';
export * from './prompts/context-commands/design-context.js';

// Export BMAD document-aware prompts
export * from './prompts/bmad-prompts/document-prompts.js';

// Export BMAD phase-aware prompts
export * from './prompts/bmad-prompts/phase-prompts.js';

// Export document loader service
export * from './services/documentLoaderService.js';

// Export memory injection service
export * from './services/memoryInjectionService.js';

// Export phase detection service
export * from './services/phaseDetectionService.js';

// Export compression service
export * from './services/compressionService.js';

// Export Definition-of-Done service
export * from './services/definitionOfDoneService.js';

// Export token estimation service (Masalah #2 optimization)
export * from './services/tokenEstimationService.js';

// Export environment context cache (Masalah #3 optimization)
export * from './services/environmentContextCache.js';

// Export models
export {
  type ModelCapabilities,
  type ModelGenerationConfig,
  type ModelConfig as ProviderModelConfig,
  type ModelProvidersConfig,
  type ResolvedModelConfig,
  type AvailableModel,
  type ModelSwitchMetadata,
  QWEN_OAUTH_MODELS,
  ModelRegistry,
  ModelsConfig,
  type ModelsConfigOptions,
  type OnModelChangeCallback,
  // Model configuration resolver
  resolveModelConfig,
  validateModelConfig,
  type ModelConfigSourcesInput,
  type ModelConfigCliInput,
  type ModelConfigSettingsInput,
  type ModelConfigResolutionResult,
  type ModelConfigValidationResult,
} from './models/index.js';

// Export Core Logic
export * from './core/client.js';
export * from './core/contentGenerator.js';
export * from './core/geminiChat.js';
export * from './core/logger.js';
export * from './core/prompts.js';
export * from './core/tokenLimits.js';
export * from './core/turn.js';
export * from './core/geminiRequest.js';
export * from './core/coreToolScheduler.js';
export * from './core/nonInteractiveToolExecutor.js';

export * from './qwen/qwenOAuth2.js';

// Export utilities
export * from './utils/paths.js';
export * from './utils/schemaValidator.js';
export * from './utils/errors.js';
export * from './utils/getFolderStructure.js';
export * from './utils/memoryDiscovery.js';
export * from './utils/gitIgnoreParser.js';
export * from './utils/gitUtils.js';
export * from './utils/editor.js';
export * from './utils/quotaErrorDetection.js';
export * from './utils/fileUtils.js';
export * from './utils/retry.js';
export * from './utils/shell-utils.js';
export * from './utils/tool-utils.js';
export * from './utils/terminalSerializer.js';
export * from './utils/systemEncoding.js';
export * from './utils/textUtils.js';
export * from './utils/formatters.js';
export * from './utils/generateContentResponseUtilities.js';
export * from './utils/ripgrepUtils.js';
export * from './utils/filesearch/fileSearch.js';
export * from './utils/errorParsing.js';
export * from './utils/workspaceContext.js';
export * from './utils/ignorePatterns.js';
export * from './utils/partUtils.js';
export * from './utils/subagentGenerator.js';
export * from './utils/projectSummary.js';
export * from './utils/promptIdContext.js';
export * from './utils/thoughtUtils.js';

// Config resolution utilities
export * from './utils/configResolver.js';

// Export services
export * from './services/fileDiscoveryService.js';
export * from './services/gitService.js';
export * from './services/chatRecordingService.js';
export * from './services/sessionService.js';
export * from './services/fileSystemService.js';

// Export Shell Execution Service
export * from './services/shellExecutionService.js';

// Export middleware and routing (enforces priority rules)
export * from './core/prompt-engineer-middleware.js';
export * from './core/subagent-router.js';
export * from './core/task-type-detector.js';

// Export base tool definitions
export * from './tools/tools.js';
export * from './tools/tool-error.js';
export * from './tools/tool-registry.js';

// Export subagents (Phase 1)
export * from './subagents/index.js';

// Export skills
export * from './skills/index.js';

// Export agent-skill integration service
export { AgentSkillIntegrationService } from './agent-skill-integration-service.js';

// Export prompt logic
export * from './prompts/mcp-prompts.js';

// Export specific tool logic
export * from './tools/read-file.js';
export * from './tools/ls.js';
export * from './tools/grep.js';
export * from './tools/ripGrep.js';
export * from './tools/glob.js';
export * from './tools/edit.js';
export * from './tools/write-file.js';
export * from './tools/web-fetch.js';
export * from './tools/memoryTool.js';
export * from './tools/shell.js';
export * from './tools/web-search/index.js';
export * from './tools/read-many-files.js';
export * from './tools/mcp-client.js';
export * from './tools/mcp-client-manager.js';
export * from './tools/mcp-tool.js';
export * from './tools/sdk-control-client-transport.js';
export * from './tools/task.js';
export * from './tools/skill.js';
export * from './tools/todoWrite.js';
export * from './tools/exitPlanMode.js';
export * from './tools/bat.js';
export * from './tools/eza.js';
export * from './tools/native-eza-tool.js';
export * from './tools/validation-wrapper.js';
export * from './tools/file-access-validation.js';
export * from './core/priority-rules-enforcer.js';

// Export LSP types and tools
export * from './lsp/types.js';
export * from './tools/lsp.js';

// MCP OAuth
export { MCPOAuthProvider } from './mcp/oauth-provider.js';
export type {
  OAuthToken,
  OAuthCredentials,
} from './mcp/token-storage/types.js';
export { MCPOAuthTokenStorage } from './mcp/oauth-token-storage.js';
export type { MCPOAuthConfig } from './mcp/oauth-provider.js';
export type {
  OAuthAuthorizationServerMetadata,
  OAuthProtectedResourceMetadata,
} from './mcp/oauth-utils.js';
export { OAuthUtils } from './mcp/oauth-utils.js';

// Export telemetry functions
export * from './telemetry/index.js';
export * from './utils/browser.js';
// OpenAI Logging Utilities
export { OpenAILogger, openaiLogger } from './utils/openaiLogger.js';
export { Storage } from './config/storage.js';

// Export test utils
export * from './test-utils/index.js';
