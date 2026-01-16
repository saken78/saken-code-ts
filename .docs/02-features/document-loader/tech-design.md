# Technical Design: Document-Aware Prompt Injection

## Architecture Overview

```
User Input
    ↓
BuiltinCommandLoader (/docs, /vision, etc.)
    ↓
DocumentLoaderService (read .docs/*)
    ↓
DocumentContextPrompt (format docs for injection)
    ↓
Inject into conversation
```

## Components

### 1. DocumentLoaderService

**Location:** `packages/core/src/services/documentLoaderService.ts`

```typescript
interface LoadedDocument {
  path: string;
  content: string;
  lastModified: Date;
  size: number;
}

interface DocumentContext {
  vision: LoadedDocument | null;
  assumptions: LoadedDocument | null;
  systemState: LoadedDocument | null;
  prd: LoadedDocument | null;
  implementationLog: LoadedDocument | null;
  decisionsLog: LoadedDocument | null;
  bugLog: LoadedDocument | null;
}

class DocumentLoaderService {
  loadVisionContext(): Promise<string>;
  loadProductContext(): Promise<string>;
  loadProgressContext(): Promise<string>;
  loadAllContext(): Promise<DocumentContext>;
  loadFeatureContext(featureName: string): Promise<string>;
}
```

### 2. Document-Aware Prompts

**Location:** `packages/core/src/prompts/bmad-prompts/document-prompts.ts`

```typescript
export const DOCUMENT_AWARE_SYSTEM_PROMPT = `
You have access to project documentation. Always reference:
- Project vision from vision.md
- Product requirements from prd.md
- Recent decisions from decisions-log.md
- Known bugs from bug-log.md

When making decisions, ask: "Do the docs already cover this?"
`;

export function getDocumentContextPrompt(loadedDocs: DocumentContext): string {
  // Build contextual prompt from loaded docs
  // Prioritize based on conversation context
}
```

### 3. Slash Commands

**Location:** `packages/cli/src/ui/commands/`

Files:

- `docsCommand.ts` - Load all documentation context
- `visionCommand.ts` - Show project vision
- `productCommand.ts` - Load product requirements
- `progressCommand.ts` - Show implementation progress

Each command:

1. Calls DocumentLoaderService
2. Formats loaded docs nicely for display
3. Injects context into subsequent prompts
4. Shows summary of loaded docs

## Data Flow

### /docs Command Flow

```
/docs
  ↓
docsCommand.action()
  ↓
documentLoaderService.loadAllContext()
  ↓
Read: 00-context/vision.md
Read: 00-context/assumptions.md
Read: 00-context/system-state.md
Read: 01-product/prd.md
Read: 03-logs/implementation-log.md
Read: 03-logs/decisions-log.md
Read: 03-logs/bug-log.md
  ↓
Format for display (markdown)
  ↓
Show summary to user
  ↓
Inject into context for next prompt
```

### Context Injection Points

```typescript
// In prompt composition flow:
basePRM + userMemory + subagentReminder
  ↓
// NEW: Document context
+ loadedDocumentContext
  ↓
// Existing: Intelligent injection
+ promptInjectionService.getTargetedReminder()
  ↓
// Message
+ userMessage
```

## File Structure

```
.docs/
├── 00-context/
│   ├── vision.md
│   ├── assumptions.md
│   └── system-state.md
├── 01-product/
│   └── prd.md
├── 02-features/
│   └── feature-*/
│       ├── feature-spec.md
│       ├── tech-design.md
│       ├── dev-tasks.md
│       └── test-plan.md
└── 03-logs/
    ├── implementation-log.md
    ├── decisions-log.md
    ├── bug-log.md
    ├── validation-log.md
    └── insights.md
```

## Implementation Steps

1. Create DocumentLoaderService
2. Create document-aware prompts
3. Implement /docs, /vision, /product, /progress commands
4. Integrate with BuiltinCommandLoader
5. Test with real project docs
6. Add caching if performance needed

## Performance Considerations

- Document files are small (typically < 50KB each)
- Cache loaded documents for session duration
- Lazy-load only requested docs
- Async file operations to avoid blocking

## Error Handling

```typescript
// Missing .docs/ directory
→ Show helpful message about creating doc structure

// Missing individual files
→ Load what exists, note what's missing

// File read errors
→ Log error, show user-friendly message

// Very large files (>1MB)
→ Load but summarize for context injection
```

## Security Considerations

- Only load files from .docs/ directory (prevent directory traversal)
- Don't load .git, node_modules, or other sensitive dirs
- Respect .gitignore when deciding what to load
- No shell execution when reading files

## Testing Plan

- Unit: DocumentLoaderService with mock files
- Integration: Commands work with real .docs/ structure
- E2E: Full workflow from doc load to context injection
- Regression: Existing commands still work
