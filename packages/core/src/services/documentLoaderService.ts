/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';
import fs from 'node:fs';

/**
 * Represents a loaded document with metadata
 */
export interface LoadedDocument {
  path: string;
  content: string;
  size: number;
  exists: boolean;
}

/**
 * Represents all loaded BMAD documentation context
 */
export interface DocumentContext {
  vision: LoadedDocument;
  assumptions: LoadedDocument;
  systemState: LoadedDocument;
  prd: LoadedDocument;
  implementationLog: LoadedDocument;
  decisionsLog: LoadedDocument;
  bugLog: LoadedDocument;
  insightsLog: LoadedDocument;
}

/**
 * Service for loading and managing BMAD documentation structure
 * Enables document-aware prompt injection
 */
export class DocumentLoaderService {
  private docsRoot: string;
  private documentCache: Map<string, LoadedDocument> = new Map();
  private cacheTimeout: number = 60000; // 1 minute cache
  private lastCacheTime: Map<string, number> = new Map();

  constructor(projectRoot: string = process.cwd()) {
    this.docsRoot = path.join(projectRoot, '.docs');
  }

  /**
   * Load vision context (vision.md)
   */
  async loadVisionContext(): Promise<string> {
    const doc = await this.loadDocument('00-context/vision.md');
    return doc.exists
      ? doc.content
      : this.getMissingDocMessage('vision.md', 'Project vision and boundaries');
  }

  /**
   * Load assumptions context (assumptions.md)
   */
  async loadAssumptionsContext(): Promise<string> {
    const doc = await this.loadDocument('00-context/assumptions.md');
    return doc.exists
      ? doc.content
      : this.getMissingDocMessage(
          'assumptions.md',
          'Project assumptions and risks',
        );
  }

  /**
   * Load system state context (system-state.md)
   */
  async loadSystemStateContext(): Promise<string> {
    const doc = await this.loadDocument('00-context/system-state.md');
    return doc.exists
      ? doc.content
      : this.getMissingDocMessage('system-state.md', 'Current system state');
  }

  /**
   * Load product requirements (prd.md)
   */
  async loadProductContext(): Promise<string> {
    const doc = await this.loadDocument('01-product/prd.md');
    return doc.exists
      ? doc.content
      : this.getMissingDocMessage(
          'prd.md',
          'Product requirements and features',
        );
  }

  /**
   * Load implementation progress (implementation-log.md)
   */
  async loadProgressContext(): Promise<string> {
    const doc = await this.loadDocument('03-logs/implementation-log.md');
    return doc.exists
      ? doc.content
      : this.getMissingDocMessage(
          'implementation-log.md',
          'Implementation progress',
        );
  }

  /**
   * Load decisions context (decisions-log.md)
   */
  async loadDecisionsContext(): Promise<string> {
    const doc = await this.loadDocument('03-logs/decisions-log.md');
    return doc.exists
      ? doc.content
      : this.getMissingDocMessage(
          'decisions-log.md',
          'Architectural decisions',
        );
  }

  /**
   * Load bugs context (bug-log.md)
   */
  async loadBugsContext(): Promise<string> {
    const doc = await this.loadDocument('03-logs/bug-log.md');
    return doc.exists
      ? doc.content
      : this.getMissingDocMessage('bug-log.md', 'Known bugs and fixes');
  }

  /**
   * Load insights (insights.md)
   */
  async loadInsightsContext(): Promise<string> {
    const doc = await this.loadDocument('03-logs/insights.md');
    return doc.exists
      ? doc.content
      : this.getMissingDocMessage('insights.md', 'Lessons learned');
  }

  /**
   * Load all documentation context
   */
  async loadAllContext(): Promise<DocumentContext> {
    return {
      vision: await this.loadDocument('00-context/vision.md'),
      assumptions: await this.loadDocument('00-context/assumptions.md'),
      systemState: await this.loadDocument('00-context/system-state.md'),
      prd: await this.loadDocument('01-product/prd.md'),
      implementationLog: await this.loadDocument(
        '03-logs/implementation-log.md',
      ),
      decisionsLog: await this.loadDocument('03-logs/decisions-log.md'),
      bugLog: await this.loadDocument('03-logs/bug-log.md'),
      insightsLog: await this.loadDocument('03-logs/insights.md'),
    };
  }

  /**
   * Load a specific document
   */
  private async loadDocument(relativePath: string): Promise<LoadedDocument> {
    // Check cache first
    const cached = this.documentCache.get(relativePath);
    const cacheTime = this.lastCacheTime.get(relativePath) ?? 0;
    if (cached && Date.now() - cacheTime < this.cacheTimeout) {
      return cached;
    }

    const fullPath = path.join(this.docsRoot, relativePath);

    try {
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        const doc: LoadedDocument = {
          path: fullPath,
          content: '',
          size: 0,
          exists: false,
        };
        this.documentCache.set(relativePath, doc);
        this.lastCacheTime.set(relativePath, Date.now());
        return doc;
      }

      // Read file
      const content = fs.readFileSync(fullPath, 'utf8');
      const size = Buffer.byteLength(content, 'utf8');

      const doc: LoadedDocument = {
        path: fullPath,
        content,
        size,
        exists: true,
      };

      // Cache the result
      this.documentCache.set(relativePath, doc);
      this.lastCacheTime.set(relativePath, Date.now());

      return doc;
    } catch (error) {
      // Return empty doc on error (don't crash)
      const doc: LoadedDocument = {
        path: fullPath,
        content: `Error loading document: ${error instanceof Error ? error.message : String(error)}`,
        size: 0,
        exists: false,
      };
      return doc;
    }
  }

  /**
   * Clear document cache
   */
  clearCache(): void {
    this.documentCache.clear();
    this.lastCacheTime.clear();
  }

  /**
   * Check if .docs directory exists
   */
  async docsDirectoryExists(): Promise<boolean> {
    return fs.existsSync(this.docsRoot);
  }

  /**
   * Get count of existing doc files
   */
  async countExistingDocs(): Promise<number> {
    const context = await this.loadAllContext();
    return Object.values(context).filter((doc) => doc.exists).length;
  }

  /**
   * Format document for display in CLI
   */
  formatDocumentForDisplay(doc: LoadedDocument, title: string): string {
    if (!doc.exists) {
      return `\n❌ Document missing: ${title}\n`;
    }

    // Truncate long documents
    const MAX_DISPLAY_LENGTH = 2000;
    let content = doc.content;
    if (content.length > MAX_DISPLAY_LENGTH) {
      content =
        content.substring(0, MAX_DISPLAY_LENGTH) +
        '\n\n[... truncated for display ...]';
    }

    return `\n📄 ${title}\n${'='.repeat(50)}\n${content}\n${'='.repeat(50)}`;
  }

  /**
   * Get helpful message for missing document
   */
  private getMissingDocMessage(filename: string, description: string): string {
    return `\n⚠️  ${filename} not found\n\nTo create this file, use:\ntouch .docs/${filename}\n\nThis file should contain: ${description}`;
  }

  /**
   * Get status of all documentation
   */
  async getDocumentationStatus(): Promise<{
    totalDocs: number;
    existingDocs: number;
    missingDocs: string[];
  }> {
    const context = await this.loadAllContext();
    const missingDocs: string[] = [];

    for (const [key, doc] of Object.entries(context)) {
      if (!doc.exists) {
        missingDocs.push(key);
      }
    }

    return {
      totalDocs: 8,
      existingDocs: 8 - missingDocs.length,
      missingDocs,
    };
  }
}

/**
 * Singleton instance for global use
 */
let instance: DocumentLoaderService | null = null;

export function getDocumentLoaderService(
  projectRoot?: string,
): DocumentLoaderService {
  if (!instance) {
    instance = new DocumentLoaderService(projectRoot);
  }
  return instance;
}
