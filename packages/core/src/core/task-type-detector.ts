/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 *
 * Task Type Detector
 * Analyzes user input to determine task type for automatic subagent routing
 */

export type TaskType =
  | 'codebase-exploration' // find files, understand structure, search code
  | 'debugging' // error analysis, root cause, stack traces
  | 'code-review' // review code, security, quality
  | 'planning' // design, architecture, breaking down tasks
  | 'general'; // default, no specific agent needed

export interface TaskDetectionResult {
  type: TaskType;
  confidence: number; // 0-1, higher = more confident
  keywords: string[];
  explanation: string;
}

const TASK_PATTERNS: Record<
  TaskType,
  { keywords: string[]; patterns: RegExp[] }
> = {
  'codebase-exploration': {
    keywords: [
      'find',
      'where',
      'search',
      'grep',
      'locate',
      'show me',
      'look for',
      'find all',
      'what files',
      'codebase structure',
      'directory',
      'architecture',
      // Indonesian keywords
      'cari',
      'mencari',
      'dimana',
      'file',
      'import',
      'mengimport',
      'struktur',
      'arsitektur',
      'kode',
      'direktori',
      'folder',
      'letak',
      'lokasi',
    ],
    patterns: [
      /where\s+(are|is)\s+/i,
      /find\s+all?\s+/i,
      /search\s+for\s+/i,
      /look\s+for\s+/i,
      /show\s+me\s+/i,
      /what\s+files?\s+/i,
      /codebase\s+structure/i,
      // Indonesian patterns
      /cari\s+/i,
      /mencari\s+/i,
      /dimana\s+/i,
      /mengimport\s+/i,
      /import\s+/i,
    ],
  },
  debugging: {
    keywords: [
      'error',
      'bug',
      'failing',
      'crash',
      'debug',
      'why',
      'not working',
      'broken',
      'issue',
      'problem',
      'trace',
      'stack',
      'exception',
      'fix',
      'what went wrong',
      // Indonesian keywords
      'error',
      'bug',
      'gagal',
      'masalah',
      'debug',
      'kenapa',
      'tidak bekerja',
      'tidak jalan',
      'rusak',
      'eror',
      'perbaiki',
      'fix',
      'apa yang salah',
      'trace',
      'exception',
    ],
    patterns: [
      /error|exception|stack\s+trace/i,
      /why.*(?:not|doesn't|isn't)/i,
      /what.*wrong/i,
      /debug/i,
      /crash|crashing/i,
      /broken|not\s+working/i,
      // Indonesian patterns
      /error\s+/i,
      /bug\s+/i,
      /gagal/i,
      /masalah/i,
      /kenapa\s+/i,
      /tidak\s+(?:bekerja|jalan)/i,
      /rusak/i,
    ],
  },
  'code-review': {
    keywords: [
      'review',
      'security',
      'vulnerability',
      'best practice',
      'quality',
      'performance',
      'audit',
      'check',
      'validate',
      'test',
      'coverage',
      // Indonesian keywords
      'review',
      'keamanan',
      'kerentanan',
      'praktik terbaik',
      'kualitas',
      'performa',
      'performansi',
      'audit',
      'periksa',
      'validasi',
      'test',
      'cakupan',
    ],
    patterns: [
      /review\s+/i,
      /security\s+/i,
      /vulnerability/i,
      /best\s+practice/i,
      /code\s+quality/i,
      /audit\s+/i,
      /performance\s+(?:issue|problem|optimization)/i,
      // Indonesian patterns
      /review\s+/i,
      /keamanan\s+/i,
      /kerentanan/i,
      /kualitas\s+/i,
      /performa\s+/i,
      /performansi\s+/i,
    ],
  },
  planning: {
    keywords: [
      'plan',
      'design',
      'architecture',
      'how should',
      'approach',
      'structure',
      'organize',
      'breakdown',
      'implement',
      'strategy',
      'best way',
      'refactor',
      // Indonesian keywords
      'rencana',
      'desain',
      'desain',
      'arsitektur',
      'bagaimana',
      'pendekatan',
      'struktur',
      'organisir',
      'implementasi',
      'strategi',
      'cara terbaik',
      'refaktor',
      'perbaikan',
    ],
    patterns: [
      /how\s+should\s+/i,
      /plan\s+/i,
      /design\s+/i,
      /architecture/i,
      /best\s+way\s+/i,
      /approach\s+/i,
      /refactor/i,
      /break\s+(?:down|this)/i,
      // Indonesian patterns
      /rencana\s+/i,
      /desain\s+/i,
      /arsitektur/i,
      /bagaimana\s+/i,
      /pendekatan\s+/i,
      /refaktor/i,
      /implementasi\s+/i,
    ],
  },
  general: {
    keywords: [],
    patterns: [],
  },
};

/**
 * Detects the task type from user input
 */
export function detectTaskType(input: string): TaskDetectionResult {
  let bestMatch: {
    type: TaskType;
    confidence: number;
    keywords: string[];
    patterns: string[];
  } = {
    type: 'general',
    confidence: 0,
    keywords: [],
    patterns: [],
  };

  // Check each task type
  for (const [taskType, config] of Object.entries(TASK_PATTERNS)) {
    const matchedKeywords: string[] = [];
    const matchedPatterns: string[] = [];
    let patternMatches = 0;

    // Check for pattern matches (higher weight)
    for (const pattern of config.patterns) {
      if (pattern.test(input)) {
        patternMatches++;
        matchedPatterns.push(pattern.source);
      }
    }

    // Check for keyword matches (lower weight)
    for (const keyword of config.keywords) {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(input)) {
        matchedKeywords.push(keyword);
      }
    }

    // Calculate confidence
    // Pattern matches are weighted higher (0.7) than keywords (0.3)
    // Even a single pattern match gives 0.7 * (1 match detected) = 0.7
    const patternConfidence = patternMatches > 0 ? 0.7 : 0;
    const keywordConfidence =
      matchedKeywords.length > 0
        ? (matchedKeywords.length / config.keywords.length) * 0.3
        : 0;
    const totalConfidence = patternConfidence + keywordConfidence;

    // Update best match if this is better
    if (totalConfidence > bestMatch.confidence) {
      bestMatch = {
        type: taskType as TaskType,
        confidence: totalConfidence,
        keywords: matchedKeywords,
        patterns: matchedPatterns,
      };
    }
  }

  // Only return non-general type if confidence is above threshold
  // Lower threshold to 0.15 to catch real tasks with even single pattern match
  const CONFIDENCE_THRESHOLD = 0.15;
  if (
    bestMatch.type !== 'general' &&
    bestMatch.confidence < CONFIDENCE_THRESHOLD
  ) {
    bestMatch.type = 'general';
    bestMatch.confidence = 0;
  }

  return {
    type: bestMatch.type,
    confidence: bestMatch.confidence,
    keywords: bestMatch.keywords,
    explanation:
      bestMatch.type === 'general'
        ? 'No specific task pattern detected'
        : `Detected as ${bestMatch.type} task (confidence: ${(bestMatch.confidence * 100).toFixed(0)}%)`,
  };
}

/**
 * Gets the recommended subagent for a task type
 */
export function getRecommendedAgent(taskType: TaskType): string | null {
  const agentMap: Record<TaskType, string | null> = {
    'codebase-exploration': 'explorer',
    debugging: 'debugger',
    'code-review': 'reviewer',
    planning: 'planner',
    general: null, // No agent needed
  };

  return agentMap[taskType];
}
