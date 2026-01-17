/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Content } from '@google/genai';

/**
 * Fast token estimation service
 * Provides O(1) token count estimates without API calls
 *
 * Used for quick checks before expensive exact counting.
 * Accuracy: 85-90% (sufficient for session token limit checks)
 */
export class TokenEstimationService {
  /** Average tokens per character (based on English text) */
  private static readonly TOKENS_PER_CHAR = 0.25;

  /** Average tokens per message turn */
  private static readonly AVG_TOKENS_PER_MESSAGE = 150;

  /** System prompt typical size */
  private static readonly SYSTEM_PROMPT_TOKENS = 800;

  /** Buffer for safety margin (10% overhead) */
  private static readonly SAFETY_MARGIN = 1.1;

  /**
   * Estimate total tokens for a message conversation
   *
   * @param historyLength - Number of message turns in history
   * @param systemPromptText - System prompt text (optional, uses default estimate if not provided)
   * @param contentText - Optional content to measure (like current message)
   *
   * @returns Estimated token count (rough estimate, not exact)
   *
   * @example
   * const estimated = TokenEstimationService.estimateTotalTokens(
   *   15,  // 15 message turns
   *   systemPrompt,
   *   currentUserMessage
   * );
   * // Returns ~3000 tokens (approximately)
   */
  static estimateTotalTokens(
    historyLength: number,
    systemPromptText?: string,
    contentText?: string,
  ): number {
    // System prompt tokens
    const systemTokens = systemPromptText
      ? this.estimateTextTokens(systemPromptText)
      : this.SYSTEM_PROMPT_TOKENS;

    // History tokens (average per message)
    const historyTokens = historyLength * this.AVG_TOKENS_PER_MESSAGE;

    // Content tokens
    const contentTokens = contentText
      ? this.estimateTextTokens(contentText)
      : 0;

    // Total with safety margin
    const total = systemTokens + historyTokens + contentTokens;
    return Math.ceil(total * this.SAFETY_MARGIN);
  }

  /**
   * Estimate tokens from text content
   * Uses character-based approximation
   *
   * @param text - Text to estimate
   * @returns Estimated token count
   *
   * @example
   * const tokens = TokenEstimationService.estimateTextTokens("Hello world");
   * // Returns ~3 tokens
   */
  static estimateTextTokens(text: string): number {
    // Simple approximation: ~4 characters per token
    // Based on GPT tokenizer statistics
    const charCount = text.length;
    const estimatedTokens = Math.ceil(charCount * this.TOKENS_PER_CHAR);

    // Minimum 1 token per non-empty text
    return Math.max(1, estimatedTokens);
  }

  /**
   * Estimate tokens from Content array (history)
   *
   * @param contents - Array of conversation content (can be readonly)
   * @returns Estimated total tokens
   */
  static estimateContentTokens(contents: readonly Content[]): number {
    let totalTokens = 0;

    for (const content of contents) {
      if (content.parts) {
        for (const part of content.parts) {
          if ('text' in part && part.text) {
            totalTokens += this.estimateTextTokens(part.text);
          }
        }
      }
    }

    return totalTokens;
  }

  /**
   * Quick check: Are we approaching token limit?
   * Uses estimation for fast decision-making
   *
   * @param currentTokenEstimate - Current estimated token count
   * @param tokenLimit - Session token limit
   * @param warningThreshold - Percentage of limit (default 80%)
   *
   * @returns true if exceeding warning threshold
   *
   * @example
   * if (TokenEstimationService.isApproachingLimit(2400, 3000)) {
   *   console.log("At 80% of token limit");
   * }
   */
  static isApproachingLimit(
    currentTokenEstimate: number,
    tokenLimit: number,
    warningThreshold: number = 0.8,
  ): boolean {
    return currentTokenEstimate > tokenLimit * warningThreshold;
  }

  /**
   * Quick check: Have we exceeded token limit?
   *
   * @param currentTokenEstimate - Current estimated token count
   * @param tokenLimit - Session token limit
   * @returns true if exceeding limit
   */
  static hasExceededLimit(
    currentTokenEstimate: number,
    tokenLimit: number,
  ): boolean {
    return currentTokenEstimate > tokenLimit;
  }

  /**
   * Get estimated tokens remaining before limit
   *
   * @param currentTokenEstimate - Current estimated token count
   * @param tokenLimit - Session token limit
   * @returns Remaining tokens (or 0 if exceeded)
   */
  static getEstimatedRemainingTokens(
    currentTokenEstimate: number,
    tokenLimit: number,
  ): number {
    return Math.max(0, tokenLimit - currentTokenEstimate);
  }
}
