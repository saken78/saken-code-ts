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
  | 'deepthink' // deep analysis and complex thinking
  | 'research' // research, investigation, information gathering
  | 'content-analysis' // analyzing and understanding content
  | 'tool-creation' // building and creating tools
  | 'technical-research' // technical deep-dive research
  | 'prompt-engineering' // optimizing prompts and instructions
  | 'data-analysis' // data analysis and visualization
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
      'explore',
      'navigate',
      'browse',
      'list files',
      'project structure',
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
      'jelajahi',
      'navigasi',
      'telusuri',
      'daftar file',
      'struktur proyek',
      'berkas',
      'berkas apa',
      'file apa saja',
      'ada apa di',
      'isi dari',
      'komponen',
      'modul',
      'paket',
      'library',
      'dependensi',
      'dependencies',
      'apa saja yang ada',
      'lihatkan',
      'tunjukkan',
      'buka',
      'periksa',
      'cek',
      'temukan',
      'identifikasi',
    ],
    patterns: [
      /where\s+(are|is)\s+/i,
      /find\s+all?\s+/i,
      /search\s+for\s+/i,
      /look\s+for\s+/i,
      /show\s+me\s+/i,
      /what\s+files?\s+/i,
      /codebase\s+structure/i,
      /explore\s+/i,
      /navigate\s+/i,
      /list\s+(?:all\s+)?files?/i,
      /project\s+structure/i,
      // Indonesian patterns
      /cari\s+/i,
      /mencari\s+/i,
      /dimana\s+/i,
      /mengimport\s+/i,
      /import\s+/i,
      /jelajahi\s+/i,
      /telusuri\s+/i,
      /navigasi\s+/i,
      /daftar\s+(?:semua\s+)?(?:file|berkas)/i,
      /struktur\s+(?:proyek|project)/i,
      /apa\s+aja\s+(?:yang\s+)?ada/i,
      /tunjukkan\s+/i,
      /lihatkan\s+/i,
      /buka\s+/i,
      /periksa\s+/i,
      /cek\s+/i,
      /temukan\s+/i,
      /identifikasi\s+/i,
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
      'troubleshoot',
      'diagnose',
      'analyze error',
      'stack trace',
      'runtime error',
      'compile error',
      'syntax error',
      'logic error',
      'memory leak',
      'performance issue',
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
      'kesalahan',
      'kesalahan sintaks',
      'kesalahan logika',
      'kesalahan runtime',
      'kesalahan kompilasi',
      'bocoran memori',
      'masalah performa',
      'troubleshoot',
      'diagnosa',
      'analisis kesalahan',
      'penyebab',
      'akar masalah',
      'root cause',
      'debugging',
      'pelacakan',
      'penelusuran',
      'memperbaiki',
      'membenarkan',
      'mengatasi',
      'solusi',
      'cara mengatasi',
      'bagaimana memperbaiki',
    ],
    patterns: [
      /error|exception|stack\s+trace/i,
      /why.*(?:not|doesn't|isn't)/i,
      /what.*wrong/i,
      /debug/i,
      /crash|crashing/i,
      /broken|not\s+working/i,
      /troubleshoot/i,
      /diagnose/i,
      /runtime\s+error/i,
      /compile\s+error/i,
      /syntax\s+error/i,
      /memory\s+leak/i,
      /performance\s+issue/i,
      // Indonesian patterns
      /error\s+/i,
      /bug\s+/i,
      /gagal/i,
      /masalah/i,
      /kenapa\s+/i,
      /tidak\s+(?:bekerja|jalan)/i,
      /rusak/i,
      /kesalahan/i,
      /eror\s+/i,
      /diagnosa/i,
      /troubleshoot/i,
      /penyebab/i,
      /akar\s+masalah/i,
      /debugging/i,
      /pelacakan/i,
      /penelusuran/i,
      /memperbaiki/i,
      /mengatasi/i,
      /solusi/i,
      /cara\s+mengatasi/i,
      /bagaimana\s+memperbaiki/i,
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
      'refactor',
      'optimize',
      'improvement',
      'code smell',
      'technical debt',
      'clean code',
      'maintainability',
      'readability',
      'scalability',
      'reliability',
      'code analysis',
      'static analysis',
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
      'refaktor',
      'optimasi',
      'peningkatan',
      'kode berbau',
      'hutang teknis',
      'kode bersih',
      'maintainabilitas',
      'dapat dibaca',
      'skalabilitas',
      'reliabilitas',
      'analisis kode',
      'analisis statis',
      'pemeriksaan',
      'pengecekan',
      'evaluasi',
      'penilaian',
      'saran',
      'rekomendasi',
      'perbaikan kode',
      'pengujian',
      'testing',
      'keamanan aplikasi',
      'celah keamanan',
      'security',
    ],
    patterns: [
      /review\s+/i,
      /security\s+/i,
      /vulnerability/i,
      /best\s+practice/i,
      /code\s+quality/i,
      /audit\s+/i,
      /performance\s+(?:issue|problem|optimization)/i,
      /refactor/i,
      /optimize/i,
      /improve/i,
      /code\s+smell/i,
      /technical\s+debt/i,
      /clean\s+code/i,
      /static\s+analysis/i,
      // Indonesian patterns
      /review\s+/i,
      /keamanan\s+/i,
      /kerentanan/i,
      /kualitas\s+/i,
      /performa\s+/i,
      /performansi\s+/i,
      /refaktor/i,
      /optimasi/i,
      /peningkatan/i,
      /kode\s+bau/i,
      /hutang\s+teknis/i,
      /kode\s+bersih/i,
      /pemeriksaan/i,
      /pengecekan/i,
      /evaluasi/i,
      /penilaian/i,
      /perbaikan\s+kode/i,
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
  deepthink: {
    keywords: [
      'think',
      'analyze deeply',
      'complex',
      'reasoning',
      'step by step',
      'elaborate',
      'detailed analysis',
      'comprehensive',
      'thorough',
      'deep dive',
      'investigate thoroughly',
      // Indonesian keywords
      'pikirkan',
      'analisis mendalam',
      'kompleks',
      'penalaran',
      'langkah demi langkah',
      'elaborasi',
      'analisis detail',
      'komprehensif',
      'menyeluruh',
      'penggalian mendalam',
      'investigasi menyeluruh',
    ],
    patterns: [
      /think\s+(?:about|through|deeply)/i,
      /analyze\s+(?:deeply|thoroughly|in\s+detail)/i,
      /deep\s+dive/i,
      /step\s+by\s+step\s+analysis/i,
      /comprehensive\s+analysis/i,
      /detailed\s+(?:analysis|explanation)/i,
      /investigate\s+thoroughly/i,
      // Indonesian patterns
      /pikirkan\s+/i,
      /analisis\s+mendalam/i,
      /penggalian\s+mendalam/i,
    ],
  },
  research: {
    keywords: [
      'research',
      'investigate',
      'study',
      'look into',
      'explore',
      'examine',
      'inquiry',
      'findings',
      'discovery',
      'gather information',
      'academic',
      'literature',
      'survey',
      // Indonesian keywords
      'penelitian',
      'investigasi',
      'studi',
      'lihat ke dalam',
      'periksa',
      'pencarian',
      'temuan',
      'penemuan',
      'kumpulkan informasi',
      'akademis',
      'literatur',
      'survei',
    ],
    patterns: [
      /research/i,
      /investigate\s+/i,
      /study\s+/i,
      /look\s+into/i,
      /examine\s+/i,
      /gather\s+information/i,
      /academic\s+/i,
      /literature\s+/i,
      // Indonesian patterns
      /penelitian/i,
      /investigasi\s+/i,
      /studi\s+/i,
    ],
  },
  'content-analysis': {
    keywords: [
      'analyze',
      'analyze content',
      'summarize',
      'extract',
      'understand',
      'interpret',
      'meaning',
      'context',
      'sentiment',
      'theme',
      'pattern',
      'breakdown',
      // Indonesian keywords
      'analisis',
      'analisis konten',
      'ringkas',
      'ekstrak',
      'pahami',
      'interpretasi',
      'makna',
      'konteks',
      'sentimen',
      'tema',
      'pola',
      'pecah',
    ],
    patterns: [
      /analyze\s+(?:content|text|this)/i,
      /summarize\s+/i,
      /extract\s+/i,
      /interpret\s+/i,
      /what.*(?:mean|message|theme)/i,
      /understand\s+(?:this|content)/i,
      /pattern\s+/i,
      // Indonesian patterns
      /analisis\s+konten/i,
      /ringkas\s+/i,
      /ekstrak\s+/i,
    ],
  },
  'tool-creation': {
    keywords: [
      'create tool',
      'build tool',
      'make tool',
      'develop tool',
      'write tool',
      'implement tool',
      'generator',
      'automation',
      'script',
      'utility',
      'helper',
      'library',
      // Indonesian keywords
      'buat tool',
      'bangun tool',
      'kembangkan tool',
      'tulis tool',
      'implementasi tool',
      'generator',
      'otomasi',
      'skrip',
      'utilitas',
      'pembantu',
      'pustaka',
    ],
    patterns: [
      /(?:create|build|make|write|develop).*tool/i,
      /tool\s+(?:for|to)/i,
      /generator/i,
      /automation/i,
      /write\s+a\s+script/i,
      // Indonesian patterns
      /buat\s+(?:tool|alat)/i,
      /bangun\s+(?:tool|alat)/i,
      /otomasi/i,
    ],
  },
  'technical-research': {
    keywords: [
      'technical',
      'architecture',
      'system design',
      'infrastructure',
      'performance',
      'scalability',
      'optimization',
      'benchmark',
      'comparison',
      'evaluation',
      'specification',
      'capability',
      // Indonesian keywords
      'teknis',
      'arsitektur',
      'desain sistem',
      'infrastruktur',
      'performa',
      'skalabilitas',
      'optimasi',
      'benchmark',
      'perbandingan',
      'evaluasi',
      'spesifikasi',
      'kemampuan',
    ],
    patterns: [
      /technical\s+(?:analysis|evaluation|research)/i,
      /architecture\s+/i,
      /system\s+design/i,
      /performance\s+(?:analysis|evaluation)/i,
      /scalability\s+/i,
      /benchmark/i,
      // Indonesian patterns
      /teknis\s+/i,
      /arsitektur/i,
      /desain\s+sistem/i,
    ],
  },
  'prompt-engineering': {
    keywords: [
      'prompt',
      'instruction',
      'optimize prompt',
      'improve prompt',
      'refine prompt',
      'write prompt',
      'craft prompt',
      'prompt template',
      'few-shot',
      'chain of thought',
      // Indonesian keywords
      'prompt',
      'instruksi',
      'optimalkan prompt',
      'tingkatkan prompt',
      'sempurnakan prompt',
      'tulis prompt',
      'buat prompt',
      'template prompt',
      'few-shot',
      'rantai pemikiran',
    ],
    patterns: [
      /prompt/i,
      /instruction\s+/i,
      /(?:optimize|improve|refine|craft)\s+prompt/i,
      /few.?shot/i,
      /chain\s+of\s+thought/i,
      // Indonesian patterns
      /prompt/i,
      /instruksi/i,
      /optimalkan\s+prompt/i,
    ],
  },
  'data-analysis': {
    keywords: [
      'analyze data',
      'data analysis',
      'statistics',
      'visualize',
      'chart',
      'graph',
      'trend',
      'metric',
      'report',
      'dashboard',
      'insight',
      'correlation',
      'pattern',
      // Indonesian keywords
      'analisis data',
      'data analysis',
      'statistik',
      'visualisasi',
      'grafik',
      'tren',
      'metrik',
      'laporan',
      'dashboard',
      'wawasan',
      'korelasi',
      'pola',
    ],
    patterns: [
      /(?:analyze|analysis)\s+data/i,
      /data\s+(?:analysis|visualization)/i,
      /visualize\s+/i,
      /statistics\s+/i,
      /chart|graph|dashboard/i,
      /metric\s+/i,
      /(?:find|identify)\s+(?:trend|pattern|insight)/i,
      // Indonesian patterns
      /analisis\s+data/i,
      /data\s+analysis/i,
      /visualisasi/i,
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
 * Uses dynamic mapping based on agent metadata when available
 * Falls back to default names if no agents provided
 */
export function getRecommendedAgent(
  taskType: TaskType,
  availableAgents?: Array<{ name: string; description: string }>,
): string | null {
  // If no agents provided, use default mapping
  if (!availableAgents || availableAgents.length === 0) {
    const defaultAgentMap: Record<TaskType, string | null> = {
      'codebase-exploration': 'explorer',
      debugging: 'debugger',
      'code-review': 'reviewer',
      planning: 'planner',
      deepthink: 'deepthink',
      research: 'research-orchestrator',
      'content-analysis': 'content-analyzer',
      'tool-creation': 'tool-creator',
      'technical-research': 'technical-researcher',
      'prompt-engineering': 'prompt-engineer',
      'data-analysis': 'data-analyst',
      general: null, // No agent needed
    };
    return defaultAgentMap[taskType];
  }

  // Dynamically match task types to agents based on metadata
  const taskTypeToKeywords: Record<TaskType, string[]> = {
    'codebase-exploration': [
      'explorer',
      'exploration',
      'codebase',
      'navigate',
      'find',
    ],
    debugging: ['debugger', 'debug', 'error', 'troubleshoot', 'diagnosis'],
    'code-review': ['reviewer', 'review', 'quality', 'security', 'audit'],
    planning: ['planner', 'plan', 'design', 'architecture'],
    deepthink: ['deepthink', 'deep', 'think', 'analyze', 'reasoning'],
    research: [
      'research-orchestrator',
      'research',
      'researcher',
      'academic',
      'investigate',
      'coordinator',
      'research-brief-generator',
      'research-coordinator',
      'academic-researcher',
      'research-synthesizer',
    ],
    'content-analysis': [
      'content-analyzer',
      'analyzer',
      'analysis',
      'content',
      'synthesizer',
      'evaluate',
    ],
    'tool-creation': [
      'tool-creator',
      'tool',
      'creator',
      'generator',
      'builder',
      'automation',
    ],
    'technical-research': [
      'technical-researcher',
      'technical',
      'researcher',
      'performance',
      'architecture',
      'system',
    ],
    'prompt-engineering': [
      'prompt-engineer',
      'engineer',
      'prompt',
      'instruction',
      'optimization',
      'clarifier',
      'query-clarifier',
    ],
    'data-analysis': [
      'data-analyst',
      'analyst',
      'data',
      'visualization',
      'report',
      'generator',
      'report-generator',
    ],
    general: [],
  };

  const keywords = taskTypeToKeywords[taskType];

  // Find agent with best keyword match in name or description
  let bestAgent: string | null = null;
  let bestScore = 0;

  for (const agent of availableAgents) {
    let score = 0;
    const lowerName = agent.name.toLowerCase();
    const lowerDescription = agent.description.toLowerCase();

    // Check for keyword matches with scoring
    for (const keyword of keywords) {
      // Exact matches in name get highest score
      if (lowerName === keyword) {
        score += 10;
      }
      // Check for keyword as a complete part separated by hyphens (for kebab-case agent names)
      else if (lowerName.split('-').includes(keyword)) {
        score += 7;
      }
      // Partial matches in name get higher score
      else if (lowerName.includes(keyword)) {
        score += 3;
      }

      // Matches in description get lower score
      if (lowerDescription.includes(keyword)) {
        score += 1;
      }
    }

    // For general task type, return null (no specialization needed)
    if (taskType === 'general') {
      return null;
    }

    // Update best match if this agent scores higher
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent.name;
    }
  }

  // Return best match if found with reasonable confidence, otherwise null
  return bestScore > 0 ? bestAgent : null;
}
