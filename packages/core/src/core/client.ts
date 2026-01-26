/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// External dependencies
import type {
  Content,
  GenerateContentConfig,
  GenerateContentResponse,
  PartListUnion,
  Tool,
} from '@google/genai';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// Config
import { ApprovalMode, type Config } from '../config/config.js';

// Core modules
import type { ContentGenerator } from './contentGenerator.js';
import { GeminiChat } from './geminiChat.js';
import {
  getCoreSystemPrompt,
  // getCustomSystemPrompt,
  getPlanModeSystemReminder,
  getSubagentSystemReminder,
} from './prompts.js';
import {
  CompressionStatus,
  GeminiEventType,
  Turn,
  type ChatCompressionInfo,
  type ServerGeminiStreamEvent,
} from './turn.js';

// Services
import {
  ChatCompressionService,
  COMPRESSION_PRESERVE_THRESHOLD,
  COMPRESSION_TOKEN_THRESHOLD,
} from '../services/chatCompressionService.js';
import { PromptInjectionService } from '../services/promptInjectionService.js';
import { TokenEstimationService } from '../services/tokenEstimationService.js';
import { EnvironmentContextCache } from '../services/environmentContextCache.js';

// Tools
import { TaskTool } from '../tools/task.js';

// Telemetry
import {
  NextSpeakerCheckEvent,
  logNextSpeakerCheck,
} from '../telemetry/index.js';
import { uiTelemetryService } from '../telemetry/uiTelemetry.js';

// Utilities
import {
  getDirectoryContextString,
  getInitialChatHistory,
} from '../utils/environmentContext.js';
import {
  buildApiHistoryFromConversation,
  replayUiTelemetryFromConversation,
} from '../services/sessionService.js';
import { reportError } from '../utils/errorReporting.js';
import { getErrorMessage } from '../utils/errors.js';
import { checkNextSpeaker } from '../utils/nextSpeakerChecker.js';
import { flatMapTextParts } from '../utils/partUtils.js';
import { retryWithBackoff } from '../utils/retry.js';

// Fallback handling
import { handleFallback } from '../fallback/handler.js';

const MAX_TURNS = 100;

export class GeminiClient {
  private chat?: GeminiChat;
  private sessionTurnCount = 0;

  // private readonly loopDetector: LoopDetectionService;
  private readonly promptInjectionService: PromptInjectionService;
  private lastPromptId: string | undefined = undefined;

  /**
   * At any point in this conversation, was compression triggered without
   * being forced and did it fail?
   */
  private hasFailedCompressionAttempt = false;

  constructor(private readonly config: Config) {
    this.promptInjectionService = new PromptInjectionService();
  }

  async initialize() {
    this.lastPromptId = this.config.getSessionId();

    // Check if we're resuming from a previous session
    const resumedSessionData = this.config.getResumedSessionData();
    if (resumedSessionData) {
      replayUiTelemetryFromConversation(resumedSessionData.conversation);
      // Convert resumed session to API history format
      // Each ChatRecord's message field is already a Content object
      const resumedHistory = buildApiHistoryFromConversation(
        resumedSessionData.conversation,
      );
      this.chat = await this.startChat(resumedHistory);
    } else {
      this.chat = await this.startChat();
    }
  }

  private getContentGeneratorOrFail(): ContentGenerator {
    if (!this.config.getContentGenerator()) {
      throw new Error('Content generator not initialized');
    }
    return this.config.getContentGenerator();
  }

  async addHistory(content: Content) {
    this.getChat().addHistory(content);
  }

  getChat(): GeminiChat {
    if (!this.chat) {
      throw new Error('Chat not initialized');
    }
    return this.chat;
  }

  isInitialized(): boolean {
    return this.chat !== undefined;
  }

  getHistory(): readonly Content[] {
    return this.getChat().getHistory();
  }

  /**
   * Get mutable copy of history (use only when you need to modify)
   */
  getHistoryMutable(): Content[] {
    return this.getChat().getHistoryMutable();
  }

  stripThoughtsFromHistory() {
    this.getChat().stripThoughtsFromHistory();
  }

  setHistory(history: Content[]) {
    this.getChat().setHistory(history);
  }

  async setTools(): Promise<void> {
    const toolRegistry = this.config.getToolRegistry();
    const toolDeclarations = toolRegistry.getFunctionDeclarations();
    const tools: Tool[] = [{ functionDeclarations: toolDeclarations }];
    this.getChat().setTools(tools);
  }

  async resetChat(): Promise<void> {
    // Invalidate cache when resetting chat
    EnvironmentContextCache.invalidate();
    this.chat = await this.startChat();
  }

  // getLoopDetectionService(): LoopDetectionService {
  //   return this.loopDetector;
  // }

  async addDirectoryContext(): Promise<void> {
    if (!this.chat) {
      return;
    }

    this.getChat().addHistory({
      role: 'user',
      parts: [{ text: await getDirectoryContextString(this.config) }],
    });
  }

  async startChat(extraHistory?: Content[]): Promise<GeminiChat> {
    this.hasFailedCompressionAttempt = false;
    this.promptInjectionService.resetMetrics();

    const toolRegistry = this.config.getToolRegistry();
    const toolDeclarations = toolRegistry.getFunctionDeclarations();
    const tools: Tool[] = [{ functionDeclarations: toolDeclarations }];

    // ✓ OPTIMIZED: Try cache first
    let history = EnvironmentContextCache.getCached();
    if (!history) {
      // Cache miss - compute and store
      history = await getInitialChatHistory(this.config, extraHistory);
      EnvironmentContextCache.setCached(history);
    } else if (extraHistory) {
      // Cache hit but we have extra history to append
      history = [...history, ...extraHistory];
    }

    try {
      const userMemory = this.config.getUserMemory();
      const model = this.config.getModel();
      const systemInstruction = getCoreSystemPrompt(
        userMemory,
        model,
        this.config,
      );

      return new GeminiChat(
        this.config,
        {
          systemInstruction,
          tools,
        },
        history,
        this.config.getChatRecordingService(),
      );
    } catch (error) {
      await reportError(
        error,
        'Error initializing chat session.',
        history,
        'startChat',
      );
      throw new Error(`Failed to initialize chat: ${getErrorMessage(error)}`);
    }
  }

  async *sendMessageStream(
    request: PartListUnion,
    signal: AbortSignal,
    prompt_id: string,
    options?: { isContinuation: boolean },
    turns: number = MAX_TURNS,
  ): AsyncGenerator<ServerGeminiStreamEvent, Turn> {
    if (!options?.isContinuation) {
      this.lastPromptId = prompt_id;

      // record user message for session management
      this.config.getChatRecordingService()?.recordUserMessage(request);

      // strip thoughts from history before sending the message
      this.stripThoughtsFromHistory();
    }
    this.sessionTurnCount++;
    if (
      this.config.getMaxSessionTurns() > 0 &&
      this.sessionTurnCount > this.config.getMaxSessionTurns()
    ) {
      yield { type: GeminiEventType.MaxSessionTurns };
      return new Turn(this.getChat(), prompt_id);
    }
    // Ensure turns never exceeds MAX_TURNS to prevent infinite loops
    const boundedTurns = Math.min(turns, MAX_TURNS);
    if (!boundedTurns) {
      return new Turn(this.getChat(), prompt_id);
    }

    const compressed = await this.tryCompressChat(prompt_id, false);

    if (compressed.compressionStatus === CompressionStatus.COMPRESSED) {
      yield { type: GeminiEventType.ChatCompressed, value: compressed };
    }

    // Check session token limit using fast token estimation
    const sessionTokenLimit = this.config.getSessionTokenLimit();
    if (sessionTokenLimit > 0) {
      const currentHistory = this.getChat().getHistory(true);
      const userMemory = this.config.getUserMemory();
      const systemPrompt = getCoreSystemPrompt(
        userMemory,
        this.config.getModel(),
        this.config,
      );

      // ✓ OPTIMIZED: Use fast token estimation instead of API call
      const estimatedSystemTokens =
        TokenEstimationService.estimateTextTokens(systemPrompt);
      const estimatedHistoryTokens =
        TokenEstimationService.estimateContentTokens(currentHistory);
      const estimatedTotalTokens =
        estimatedSystemTokens + estimatedHistoryTokens;

      if (estimatedTotalTokens > sessionTokenLimit) {
        yield {
          type: GeminiEventType.SessionTokenLimitExceeded,
          value: {
            currentTokens: estimatedTotalTokens,
            limit: sessionTokenLimit,
            message:
              `Session token limit exceeded: ~${estimatedTotalTokens} tokens (estimated) > ${sessionTokenLimit} limit. ` +
              'Please start a new session or increase the sessionTokenLimit in your settings.json.',
          },
        };
        return new Turn(this.getChat(), prompt_id);
      }
    }

    // Prevent context updates from being sent while a tool call is
    // waiting for a response. The Qwen API requires that a functionResponse
    // part from the user immediately follows a functionCall part from the model
    // in the conversation history . The IDE context is not discarded; it will
    // be included in the next regular message sent to the model.
    const history = this.getHistory();
    const lastMessage =
      history.length > 0 ? history[history.length - 1] : undefined;
    const hasPendingToolCall =
      !!lastMessage &&
      lastMessage.role === 'model' &&
      (lastMessage.parts?.some((p) => 'functionCall' in p) || false);

    if (!hasPendingToolCall) {
      // console.log
    }

    const turn = new Turn(this.getChat(), prompt_id);

    // append system reminders to the request
    let requestToSent = await flatMapTextParts(request, async (text) => [text]);
    if (!options?.isContinuation) {
      const systemReminders = [];

      // add subagent system reminder if there are subagents
      const hasTaskTool = this.config.getToolRegistry().getTool(TaskTool.Name);
      const subagents = (await this.config.getSubagentManager().listSubagents())
        .filter((subagent) => subagent.level !== 'builtin')
        .map((subagent) => subagent.name);

      if (hasTaskTool && subagents.length > 0) {
        systemReminders.push(getSubagentSystemReminder(subagents));
      }

      // ✨ Load and inject saken.md memory - always fresh per turn
      try {
        // Buat config file untuk path
        const config = {
          sakenPath: '../../.qwen/saken.md', // Make it relative to project root
        };

        const sakenPath = path.join(process.cwd(), config.sakenPath);
        const sakenMemory = await fs.readFile(sakenPath, 'utf-8');
        if (sakenMemory.trim()) {
          systemReminders.push(
            `<system-reminder type="project-memory">\n## Qwen Project Memory (saken.md)\n\n${sakenMemory}\n</system-reminder>`,
          );
        }
        console.debug('saken.md loaded');
      } catch (error) {
        // Silently fail - saken.md is optional
        console.debug('saken.md not found or error reading:', error);
      }

      // add plan mode system reminder if approval mode is plan
      if (this.config.getApprovalMode() === ApprovalMode.PLAN) {
        systemReminders.push(
          getPlanModeSystemReminder(this.config.getSdkMode()),
        );
      }

      // RUNTIME TOOL REGISTRY CHECK: Always include current tool availability state
      try {
        const toolRegistry = this.config.getToolRegistry();
        const allTools = toolRegistry.getAllToolNames();

        // Check for Deepthink agent
        const hasDeepthink = subagents.includes('deepthink');

        // Check for WriteTodos tool
        const hasWriteTodos = allTools.includes('todo_write');

        if (hasDeepthink || hasWriteTodos) {
          const availableFeatures = [];
          if (hasDeepthink) availableFeatures.push('deepthink');
          if (hasWriteTodos) availableFeatures.push('todo_write');

          systemReminders.push(
            `<system-reminder type="runtime-tools">\nCurrent available tools at runtime: ${availableFeatures.join(', ')}\n</system-reminder>`,
          );
        }
      } catch (error) {
        // Silently fail - tool registry checks are optional
        console.debug('Runtime tool registry check failed:', error);
      }

      // INTELLIGENT PROMPT INJECTION: Analyze conversation and inject core prompt if needed
      const currentHistory = this.getChat().getHistory(true);
      this.promptInjectionService.updateMetrics(currentHistory);

      if (this.promptInjectionService.shouldInjectCorePrompt()) {
        const userMemory = this.config.getUserMemory();
        const model = this.config.getModel();
        const corePrompt = getCoreSystemPrompt(userMemory, model, this.config);

        systemReminders.push(
          `<system-reminder type="core-prompt-reinforcement">\nCore system prompt reinforcement injected to minimize hallucination and ensure adherence to best practices.\n\n${corePrompt}\n</system-reminder>`,
        );

        // Record that we've injected the core prompt
        this.promptInjectionService.recordCorePromptInjection();

        // Also add targeted reminder if there are specific hallucination patterns detected
        const targetedReminder =
          this.promptInjectionService.getTargetedReminderForInjection();
        if (targetedReminder) {
          systemReminders.push(targetedReminder);
        }
      }

      requestToSent = [...systemReminders, ...requestToSent];
    }

    // Record tool usage and error patterns for prompt injection service
    const handleToolUsageAndErrors = (event: ServerGeminiStreamEvent) => {
      if (
        event.type === GeminiEventType.ToolCallRequest ||
        event.type === GeminiEventType.ToolCallResponse
      ) {
        this.promptInjectionService.recordToolUsage();
      } else if (event.type === GeminiEventType.Error) {
        this.promptInjectionService.recordErrorEncounter();
      }
    };

    const resultStream = turn.run(
      this.config.getModel(),
      requestToSent,
      signal,
    );
    for await (const event of resultStream) {
      handleToolUsageAndErrors(event);
      yield event;
      if (event.type === GeminiEventType.Error) {
        return turn;
      }
    }
    if (!turn.pendingToolCalls.length && signal && !signal.aborted) {
      if (this.config.getSkipNextSpeakerCheck()) {
        return turn;
      }

      const nextSpeakerCheck = await checkNextSpeaker(
        this.getChat(),
        this.config,
        signal,
        prompt_id,
      );
      logNextSpeakerCheck(
        this.config,
        new NextSpeakerCheckEvent(
          prompt_id,
          turn.finishReason?.toString() || '',
          nextSpeakerCheck?.next_speaker || '',
        ),
      );
      if (nextSpeakerCheck?.next_speaker === 'model') {
        const nextRequest = [{ text: 'Please continue.' }];
        // This recursive call's events will be yielded out, but the final
        // turn object will be from the top-level call.
        yield* this.sendMessageStream(
          nextRequest,
          signal,
          prompt_id,
          { ...options, isContinuation: true },
          boundedTurns - 1,
        );
      }
    }
    return turn;
  }

  async generateContent(
    contents: Content[],
    generationConfig: GenerateContentConfig,
    abortSignal: AbortSignal,
    model: string,
  ): Promise<GenerateContentResponse> {
    let currentAttemptModel: string = model;

    try {
      const userMemory = this.config.getUserMemory();
      // const finalSystemInstruction = generationConfig.systemInstruction
      //   ? getCustomSystemPrompt(generationConfig.systemInstruction, userMemory)
      //   : getCoreSystemPrompt(userMemory, this.config.getModel());
      const finalSystemInstruction = getCoreSystemPrompt(
        userMemory,
        this.config.getModel(),
        this.config,
      );

      const requestConfig: GenerateContentConfig = {
        abortSignal,
        ...generationConfig,
        systemInstruction: finalSystemInstruction,
      };

      const apiCall = () => {
        currentAttemptModel = model;

        return this.getContentGeneratorOrFail().generateContent(
          {
            model,
            config: requestConfig,
            contents,
          },
          this.lastPromptId!,
        );
      };
      const onPersistent429Callback = async (
        authType?: string,
        error?: unknown,
      ) =>
        // Pass the captured model to the centralized handler.
        await handleFallback(this.config, currentAttemptModel, authType, error);

      const result = await retryWithBackoff(apiCall, {
        onPersistent429: onPersistent429Callback,
        authType: this.config.getContentGeneratorConfig()?.authType,
      });
      return result;
    } catch (error: unknown) {
      if (abortSignal.aborted) {
        throw error;
      }

      await reportError(
        error,
        `Error generating content via API with model ${currentAttemptModel}.`,
        {
          requestContents: contents,
          requestConfig: generationConfig,
        },
        'generateContent-api',
      );
      throw new Error(
        `Failed to generate content with model ${currentAttemptModel}: ${getErrorMessage(error)}`,
      );
    }
  }

  async tryCompressChat(
    prompt_id: string,
    force: boolean = false,
  ): Promise<ChatCompressionInfo> {
    const compressionService = new ChatCompressionService();

    const { newHistory, info } = await compressionService.compress(
      this.getChat(),
      prompt_id,
      force,
      this.config.getModel(),
      this.config,
      this.hasFailedCompressionAttempt,
    );

    // Handle compression result
    if (info.compressionStatus === CompressionStatus.COMPRESSED) {
      // Success: update chat with new compressed history
      if (newHistory) {
        const chatRecordingService = this.config.getChatRecordingService();
        chatRecordingService?.recordChatCompression({
          info,
          compressedHistory: newHistory,
        });

        this.chat = await this.startChat(newHistory);
        uiTelemetryService.setLastPromptTokenCount(info.newTokenCount);
      }
    } else if (
      info.compressionStatus ===
        CompressionStatus.COMPRESSION_FAILED_INFLATED_TOKEN_COUNT ||
      info.compressionStatus ===
        CompressionStatus.COMPRESSION_FAILED_EMPTY_SUMMARY
    ) {
      // Track failed attempts (only mark as failed if not forced)
      if (!force) {
        this.hasFailedCompressionAttempt = true;
      }
    }

    return info;
  }
}

export const TEST_ONLY = {
  COMPRESSION_PRESERVE_THRESHOLD,
  COMPRESSION_TOKEN_THRESHOLD,
};
