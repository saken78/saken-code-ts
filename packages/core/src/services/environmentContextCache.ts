/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Content } from '@google/genai';

/**
 * Cache for environment context (directory structure, files, etc.)
 * Reduces redundant file I/O operations that can cause 5-30 second delays
 *
 * Strategy: Time-based cache with 60-second validity
 * Cache is automatically invalidated after timeout or can be manually invalidated
 */
export class EnvironmentContextCache {
  /** Cache validity duration in milliseconds (60 seconds) */
  private static readonly CACHE_VALIDITY_MS = 60 * 1000;

  /** Cached environment context */
  private static cachedContext: {
    history: Content[];
    timestamp: number;
  } | null = null;

  /**
   * Get cached environment context if still valid
   *
   * @returns Cached context or null if cache expired or empty
   */
  static getCached(): Content[] | null {
    if (!this.cachedContext) {
      return null;
    }

    const now = Date.now();
    const age = now - this.cachedContext.timestamp;

    // Check if cache is still valid (not expired)
    if (age > this.CACHE_VALIDITY_MS) {
      // Cache expired - clear it
      this.cachedContext = null;
      return null;
    }

    return this.cachedContext.history;
  }

  /**
   * Store context in cache
   *
   * @param history - Environment context history to cache
   */
  static setCached(history: Content[]): void {
    this.cachedContext = {
      history,
      timestamp: Date.now(),
    };
  }

  /**
   * Check if cache is valid without retrieving it
   * Useful for deciding whether to recompute
   *
   * @returns true if cache exists and is not expired
   */
  static isCacheValid(): boolean {
    if (!this.cachedContext) {
      return false;
    }

    const now = Date.now();
    const age = now - this.cachedContext.timestamp;
    return age <= this.CACHE_VALIDITY_MS;
  }

  /**
   * Manually invalidate cache (e.g., when workspace files change)
   */
  static invalidate(): void {
    this.cachedContext = null;
  }

  /**
   * Get cache age in milliseconds
   * Returns -1 if no cache exists
   */
  static getCacheAge(): number {
    if (!this.cachedContext) {
      return -1;
    }
    return Date.now() - this.cachedContext.timestamp;
  }

  /**
   * Get cache statistics (for debugging/monitoring)
   */
  static getStats(): {
    hasCachedContext: boolean;
    age: number;
    validity: number;
    isValid: boolean;
  } {
    const hasCachedContext = !!this.cachedContext;
    const age = this.getCacheAge();
    const isValid = this.isCacheValid();

    return {
      hasCachedContext,
      age,
      validity: this.CACHE_VALIDITY_MS,
      isValid,
    };
  }
}
