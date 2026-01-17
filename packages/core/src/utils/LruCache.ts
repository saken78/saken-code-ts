/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export class LruCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  private hits = 0;
  private misses = 0;
  constructor(maxSize: number) {
    this.cache = new Map<K, V>();
    this.maxSize = maxSize;
  }
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value) {
      this.hits++;
      // Move to end to mark as recently used
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    this.misses++;
    return undefined;
  }
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }
  has(key: K): boolean {
    return this.cache.has(key);
  }
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
  size(): number {
    return this.cache.size;
  }
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate:
        this.hits + this.misses > 0
          ? (this.hits / (this.hits + this.misses)) * 100
          : 0,
    };
  }
}
