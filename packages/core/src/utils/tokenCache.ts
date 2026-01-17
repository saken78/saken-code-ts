/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import { createHash } from 'node:crypto';
import { LruCache } from './LruCache.js';
import type { TokenCountResult } from './types/cache.js';
export class TokenCountingCache {
  private cache: LruCache<string, TokenCountResult>;
  constructor(maxSize = 1000) {
    this.cache = new LruCache<string, TokenCountResult>(maxSize);
  }
  private generateContentHash(contents: Content[]): string {
    const contentString = JSON.stringify(contents);
    return createHash('sha256').update(contentString).digest('hex');
  }
  getCachedTokenCount(
    contents: Content[],
    model: string,
  ): TokenCountResult | undefined {
    const contentHash = this.generateContentHash(contents);
    const cacheKey = `${contentHash}:${model}`;
    return this.cache.get(cacheKey);
  }
  cacheTokenCount(
    contents: Content[],
    model: string,
    result: TokenCountResult,
  ): void {
    const contentHash = this.generateContentHash(contents);
    const cacheKey = `${contentHash}:${model}`;
    this.cache.set(cacheKey, result);
  }
  getStats() {
    return this.cache.getStats();
  }
  clear(): void {
    this.cache.clear();
  }
}
