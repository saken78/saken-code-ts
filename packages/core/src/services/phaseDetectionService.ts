/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Project phases for context-aware prompts
 */
export type ProjectPhase = 'plan' | 'dev' | 'review' | 'release';

/**
 * Phase detection result with confidence level
 */
export interface PhaseDetectionResult {
  phase: ProjectPhase;
  confidence: number; // 0-1
  reason: string;
  detected: boolean; // true if auto-detected, false if manual
}

/**
 * Service for detecting and managing project phase
 * Enables phase-aware prompt injection
 */
export class PhaseDetectionService {
  private currentPhase: ProjectPhase = 'dev'; // default
  private wasManuallySet: boolean = false;

  /**
   * Detect project phase from git branch
   */
  private detectFromGitBranch(): ProjectPhase | null {
    try {
      const branch = execSync('git branch --show-current', {
        encoding: 'utf8',
      })
        .trim()
        .toLowerCase();

      // Branch name patterns
      if (branch === 'main' || branch === 'master') {
        return 'release';
      }
      if (branch.includes('release')) {
        return 'release';
      }
      if (branch.includes('develop')) {
        return 'dev';
      }
      if (branch.includes('feature')) {
        return 'dev';
      }
      if (branch.includes('planning')) {
        return 'plan';
      }
      if (branch.includes('review')) {
        return 'review';
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Detect phase from documentation structure
   */
  private detectFromDocs(): ProjectPhase | null {
    try {
      const docsPath = path.join(process.cwd(), '.docs');

      // Check if .docs exists
      if (!fs.existsSync(docsPath)) {
        return null;
      }

      // Check for planning docs
      const systemStatePath = path.join(
        docsPath,
        '00-context',
        'system-state.md',
      );
      if (fs.existsSync(systemStatePath)) {
        const content = fs.readFileSync(systemStatePath, 'utf8');
        if (content.includes('Phase 1:') || content.includes('PLANNING')) {
          return 'plan';
        }
        if (content.includes('IN PROGRESS')) {
          return 'dev';
        }
        if (content.includes('REVIEW') || content.includes('TESTING')) {
          return 'review';
        }
        if (content.includes('RELEASE') || content.includes('SHIPPED')) {
          return 'release';
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Auto-detect project phase
   */
  async detectPhase(): Promise<PhaseDetectionResult> {
    // If manually set, respect that
    if (this.wasManuallySet) {
      return {
        phase: this.currentPhase,
        confidence: 1.0,
        reason: 'Manually set by user',
        detected: false,
      };
    }

    // Try git branch detection first (higher confidence)
    const gitPhase = this.detectFromGitBranch();
    if (gitPhase) {
      this.currentPhase = gitPhase;
      return {
        phase: gitPhase,
        confidence: 0.9,
        reason: `Detected from git branch`,
        detected: true,
      };
    }

    // Try docs detection (medium confidence)
    const docsPhase = this.detectFromDocs();
    if (docsPhase) {
      this.currentPhase = docsPhase;
      return {
        phase: docsPhase,
        confidence: 0.7,
        reason: `Detected from .docs structure`,
        detected: true,
      };
    }

    // Default to dev
    return {
      phase: 'dev',
      confidence: 0.0,
      reason: 'No detection possible, defaulting to dev',
      detected: false,
    };
  }

  /**
   * Manually set project phase
   */
  setPhase(phase: ProjectPhase): void {
    this.currentPhase = phase;
    this.wasManuallySet = true;
  }

  /**
   * Get current phase
   */
  getCurrentPhase(): ProjectPhase {
    return this.currentPhase;
  }

  /**
   * Reset to auto-detection
   */
  resetToAutoDetect(): void {
    this.wasManuallySet = false;
  }

  /**
   * Get phase description
   */
  getPhaseDescription(phase: ProjectPhase): string {
    const descriptions: Record<ProjectPhase, string> = {
      plan: 'Planning: Requirements, architecture, scope definition',
      dev: 'Development: Implementation, testing, quality checks',
      review: 'Review: Code quality, security, performance analysis',
      release: 'Release: Stability, documentation, deployment readiness',
    };
    return descriptions[phase];
  }

  /**
   * Get phase emoji
   */
  getPhaseEmoji(phase: ProjectPhase): string {
    const emojis: Record<ProjectPhase, string> = {
      plan: '📋',
      dev: '💻',
      review: '🔍',
      release: '🚀',
    };
    return emojis[phase];
  }
}

/**
 * Singleton instance
 */
let instance: PhaseDetectionService | null = null;

export function getPhaseDetectionService(): PhaseDetectionService {
  if (!instance) {
    instance = new PhaseDetectionService();
  }
  return instance;
}
