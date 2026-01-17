/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { LruCache } from './LruCache.js';
interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metricsCache: LruCache<string, PerformanceMetrics[]>;
  private activeOperations: Map<string, PerformanceMetrics>;
  private constructor() {
    this.metricsCache = new LruCache<string, PerformanceMetrics[]>(1000);
    this.activeOperations = new Map();
  }
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  startOperation(
    operationName: string,
    metadata?: Record<string, never>,
  ): string {
    const operationId = `${operationName}_${Date.now()}_${Math.random()}`;
    const metric: PerformanceMetrics = {
      operationName,
      startTime: performance.now(),
      metadata,
    };

    this.activeOperations.set(operationId, metric);
    return operationId;
  }
  endOperation(operationId: string): number | undefined {
    const metric = this.activeOperations.get(operationId);
    if (!metric) {
      return undefined;
    }
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    this.activeOperations.delete(operationId);

    // Store in cache
    const existing = this.metricsCache.get(metric.operationName) || [];
    existing.push(metric);
    this.metricsCache.set(metric.operationName, existing);

    return metric.duration;
  }
  getAverageDuration(operationName: string): number | undefined {
    const metrics = this.metricsCache.get(operationName);
    if (!metrics || metrics.length === 0) {
      return undefined;
    }

    const totalDuration = metrics.reduce(
      (sum, metric) => sum + (metric.duration || 0),
      0,
    );
    return totalDuration / metrics.length;
  }
  getStats() {
    return {
      activeOperations: this.activeOperations.size,
      cachedOperations: this.metricsCache.size(),
      cacheStats: this.metricsCache.getStats(),
    };
  }
  clear(): void {
    this.metricsCache.clear();
    this.activeOperations.clear();
  }
}
