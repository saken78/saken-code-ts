/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Represents a Definition-of-Done checklist item
 */
export interface DoDItem {
  category: string;
  item: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'unknown';
  details: string;
}

/**
 * Represents the full Definition-of-Done validation result
 */
export interface DoDValidationResult {
  isComplete: boolean;
  passCount: number;
  failCount: number;
  warningCount: number;
  unknownCount: number;
  items: DoDItem[];
  recommendations: string[];
}

/**
 * Service for validating Definition-of-Done criteria
 * Ensures work meets quality gates before shipping
 */
export class DefinitionOfDoneService {
  private docsRoot: string = path.join(process.cwd(), '.docs');

  /**
   * Check TypeScript compilation
   */
  private checkTypeScript(): DoDItem {
    try {
      execSync('npm run type-check', { encoding: 'utf8', stdio: 'pipe' });
      return {
        category: 'Code Quality Gates',
        item: 'Type check passes',
        description: 'Zero TypeScript errors',
        status: 'pass',
        details: 'TypeScript compilation successful',
      };
    } catch (error) {
      return {
        category: 'Code Quality Gates',
        item: 'Type check passes',
        description: 'Zero TypeScript errors',
        status: 'fail',
        details: `TypeScript check failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Check tests
   */
  private checkTests(): DoDItem {
    try {
      execSync('npm run test 2>&1', { encoding: 'utf8', stdio: 'pipe' });
      return {
        category: 'Code Quality Gates',
        item: 'Tests pass',
        description: 'All tests passing',
        status: 'pass',
        details: 'All tests passed successfully',
      };
    } catch (_error) {
      return {
        category: 'Code Quality Gates',
        item: 'Tests pass',
        description: 'All tests passing',
        status: 'fail',
        details: `Tests failed - run 'npm run test' for details`,
      };
    }
  }

  /**
   * Check build
   */
  private checkBuild(): DoDItem {
    try {
      execSync('npm run build 2>&1', { encoding: 'utf8', stdio: 'pipe' });
      return {
        category: 'Deployment Gates',
        item: 'Build passes',
        description: 'Build completes without errors',
        status: 'pass',
        details: 'Build completed successfully',
      };
    } catch (_error) {
      return {
        category: 'Deployment Gates',
        item: 'Build passes',
        description: 'Build completes without errors',
        status: 'fail',
        details: `Build failed - check error output above`,
      };
    }
  }

  /**
   * Check implementation log
   */
  private checkImplementationLog(): DoDItem {
    try {
      const logPath = path.join(
        this.docsRoot,
        '03-logs',
        'implementation-log.md',
      );
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        if (content.length > 100) {
          return {
            category: 'Documentation Gates',
            item: 'Implementation logged',
            description: 'Work documented in implementation-log.md',
            status: 'pass',
            details: `Implementation log updated (${content.length} bytes)`,
          };
        }
      }
      return {
        category: 'Documentation Gates',
        item: 'Implementation logged',
        description: 'Work documented in implementation-log.md',
        status: 'warning',
        details: 'Implementation log exists but is empty or missing',
      };
    } catch {
      return {
        category: 'Documentation Gates',
        item: 'Implementation logged',
        description: 'Work documented in implementation-log.md',
        status: 'unknown',
        details: 'Could not check implementation log',
      };
    }
  }

  /**
   * Check decisions log
   */
  private checkDecisionsLog(): DoDItem {
    try {
      const logPath = path.join(this.docsRoot, '03-logs', 'decisions-log.md');
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        if (content.includes('-') || content.includes('*')) {
          return {
            category: 'Documentation Gates',
            item: 'Decisions documented',
            description: 'Architectural decisions documented',
            status: 'pass',
            details: 'Decisions documented in decisions-log.md',
          };
        }
      }
      return {
        category: 'Documentation Gates',
        item: 'Decisions documented',
        description: 'Architectural decisions documented',
        status: 'warning',
        details: 'No decisions documented yet - add if applicable',
      };
    } catch {
      return {
        category: 'Documentation Gates',
        item: 'Decisions documented',
        description: 'Architectural decisions documented',
        status: 'unknown',
        details: 'Could not check decisions log',
      };
    }
  }

  /**
   * Check for debug statements
   */
  private checkNoDebugStatements(): DoDItem {
    try {
      const result = execSync(
        'find packages -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\\.log\\|debugger" 2>/dev/null || true',
        { encoding: 'utf8' },
      );

      if (!result.trim()) {
        return {
          category: 'Code Quality Gates',
          item: 'No debug statements',
          description: 'No console.log or debugger statements',
          status: 'pass',
          details: 'No debug statements found in code',
        };
      }

      const fileCount = result.trim().split('\n').length;
      return {
        category: 'Code Quality Gates',
        item: 'No debug statements',
        description: 'No console.log or debugger statements',
        status: 'warning',
        details: `${fileCount} file(s) contain debug statements - remove before shipping`,
      };
    } catch {
      return {
        category: 'Code Quality Gates',
        item: 'No debug statements',
        description: 'No console.log or debugger statements',
        status: 'unknown',
        details: 'Could not check for debug statements',
      };
    }
  }

  /**
   * Check linting
   */
  private checkLinting(): DoDItem {
    try {
      execSync('npm run lint 2>&1', { encoding: 'utf8', stdio: 'pipe' });
      return {
        category: 'Code Quality Gates',
        item: 'Linting passes',
        description: 'Code follows project conventions',
        status: 'pass',
        details: 'Linting check passed',
      };
    } catch (_error) {
      return {
        category: 'Code Quality Gates',
        item: 'Linting passes',
        description: 'Code follows project conventions',
        status: 'warning',
        details: `Linting has warnings - run 'npm run lint' to see details`,
      };
    }
  }

  /**
   * Validate all Definition-of-Done criteria
   */
  async validateAll(): Promise<DoDValidationResult> {
    const items: DoDItem[] = [];

    // Run all checks
    items.push(this.checkTypeScript());
    items.push(this.checkTests());
    items.push(this.checkBuild());
    items.push(this.checkImplementationLog());
    items.push(this.checkDecisionsLog());
    items.push(this.checkNoDebugStatements());
    items.push(this.checkLinting());

    // Calculate statistics
    const passCount = items.filter((i) => i.status === 'pass').length;
    const failCount = items.filter((i) => i.status === 'fail').length;
    const warningCount = items.filter((i) => i.status === 'warning').length;
    const unknownCount = items.filter((i) => i.status === 'unknown').length;

    // Generate recommendations
    const recommendations: string[] = [];
    if (failCount > 0) {
      recommendations.push(
        '❌ Critical failures detected - fix before shipping',
      );
      items
        .filter((i) => i.status === 'fail')
        .forEach((item) => {
          recommendations.push(`  • ${item.item}: ${item.details}`);
        });
    }

    if (warningCount > 0) {
      recommendations.push('⚠️  Warnings - review before shipping');
      items
        .filter((i) => i.status === 'warning')
        .forEach((item) => {
          recommendations.push(`  • ${item.item}: ${item.details}`);
        });
    }

    if (failCount === 0 && warningCount === 0) {
      recommendations.push('✅ All Definition-of-Done criteria met!');
      recommendations.push('Ready to ship! 🚀');
    }

    return {
      isComplete: failCount === 0 && warningCount === 0,
      passCount,
      failCount,
      warningCount,
      unknownCount,
      items,
      recommendations,
    };
  }

  /**
   * Get formatted validation report
   */
  async getValidationReport(): Promise<string> {
    const result = await this.validateAll();

    const lines: string[] = [
      '# Definition-of-Done Validation Report',
      '',
      `✅ Pass: ${result.passCount} | ❌ Fail: ${result.failCount} | ⚠️  Warning: ${result.warningCount}`,
      '',
    ];

    // Group by category
    const categories = new Map<string, DoDItem[]>();
    result.items.forEach((item) => {
      if (!categories.has(item.category)) {
        categories.set(item.category, []);
      }
      categories.get(item.category)!.push(item);
    });

    categories.forEach((items, category) => {
      lines.push(`## ${category}`);
      items.forEach((item) => {
        const icon =
          item.status === 'pass'
            ? '✅'
            : item.status === 'fail'
              ? '❌'
              : item.status === 'warning'
                ? '⚠️'
                : '❓';
        lines.push(`${icon} **${item.item}**: ${item.details}`);
      });
      lines.push('');
    });

    lines.push('## Recommendations');
    result.recommendations.forEach((rec) => {
      lines.push(`${rec}`);
    });

    lines.push('');
    if (result.isComplete) {
      lines.push('## Status: ✅ COMPLETE');
      lines.push(
        'Your work meets all Definition-of-Done criteria. Ready to ship!',
      );
    } else {
      lines.push('## Status: ❌ INCOMPLETE');
      lines.push(
        'Complete the items above before shipping. Use `/refresh-memory` to recall context if needed.',
      );
    }

    return lines.join('\n');
  }
}

/**
 * Singleton instance
 */
let instance: DefinitionOfDoneService | null = null;

export function getDefinitionOfDoneService(): DefinitionOfDoneService {
  if (!instance) {
    instance = new DefinitionOfDoneService();
  }
  return instance;
}
