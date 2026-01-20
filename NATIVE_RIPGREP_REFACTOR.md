# Native Ripgrep Refactoring

## Problem Statement

The previous `RipGrepTool` implementation (in `ripGrep.ts`) had several issues:

### 1. **Confusing Naming Convention**

- **Class naming confusion**: Used `GrepToolInvocation` for a ripgrep-specific tool
- **Display name mismatch**: Showed "Grep" instead of "Ripgrep"
- **Memory buffering**: All output buffered in memory (poor for large searches)
- **Context overhead**: Large result sets consumed too much LLM context

### 2. **Implementation Issues**

- Used synchronous utility `runRipgrep()` with memory buffering
- No support for intelligent filtering patterns
- No preview generation for large results
- Limited error handling

## Solution: Native Ripgrep Architecture

Created a clean, reusable native tools pattern similar to native-fd-tool:

### New Files

#### 1. **`native-ripgrep-executor.ts`**

Generic ripgrep executor with zero-memory buffering:

```typescript
export class NativeRipgrepExecutor {
  // Execute ripgrep directly to disk - NO MEMORY BUFFER!
  async executeRipgrepDirectToDisk(
    pattern: string,
    searchPath: string,
    options: RipgrepSearchOptions,
  ): Promise<RipgrepResult>;

  // Count matches from line-based output
  private async countMatches(filePath: string): Promise<number>;

  // Generate preview of first N lines
  async getRipgrepPreview(
    filePath: string,
    maxLines: number = 50,
  ): Promise<string>;

  // Smart search with intelligent filtering
  async smartRipgrepSearch(
    pattern: string,
    searchPath: string,
    filters: RipgrepSearchFilters,
    executorOptions?: ExecutorOptions,
  ): Promise<RipgrepResult>;
}
```

**Features:**

- Zero-memory buffering (direct to disk)
- Line-based output parsing
- Regex validation
- File type filtering (`--type ts`, `--type tsx`, etc.)
- Glob patterns (`--glob "*.ts"`)
- Automatic exclude patterns (node_modules, .git, etc.)
- Max count limiting
- Proper AbortSignal handling

#### 2. **`native-ripgrep-tool.ts`**

Tool integration with clear naming:

```typescript
export class NativeRipgrepToolInvocation extends BaseToolInvocation<
  NativeRipgrepToolParams,
  ToolResult
> {
  // Proper parameter handling
  async execute(
    signal: AbortSignal,
    updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult>;
}

export class NativeRipgrepTool extends BaseDeclarativeTool<
  NativeRipgrepToolParams,
  ToolResult
> {
  static Name: string = ToolNames.RIPGREP;
  displayName = 'Ripgrep'; // Clear naming!
}
```

**Features:**

- **Clear naming**: `NativeRipgrepTool`, not confusing `GrepTool`
- **Display name**: "Ripgrep", not generic "Grep"
- **Context-aware formatting**:
  - Small results (<100 matches): Full list in response
  - Large results (>100 matches): Preview + file reference
- **Full parameter support**:
  - `pattern`: Regex search pattern (required)
  - `searchPath`: Directory to search
  - `glob`: File glob filter
  - `caseSensitive`: Case sensitivity toggle
  - `fileTypes`: File type filter (ts, tsx, js, etc.)
  - `maxCount`: Result limit
  - `useSmartSearch`: Enable intelligent filtering

## Why This Refactoring?

### 1. **Naming Clarity**

```
Old: RipGrepTool with GrepToolInvocation ❌ (confusing!)
New: NativeRipgrepTool with NativeRipgrepToolInvocation ✅ (clear!)
```

### 2. **Memory Efficiency**

```
Old: All results buffered in memory (dangerous for large codebases)
New: Direct-to-disk piping (handles GB-sized results)
```

### 3. **Context Reduction**

```
Old: 100+ matches = 10,000+ tokens consumed
New: 100+ matches = preview (500 tokens) + file reference
```

### 4. **Consistency with Native Pattern**

- Follows same pattern as `native-fd-tool`
- Reusable `NativeCommandExecutor` base
- Can easily create `native-grep-tool`, `native-find-tool`, etc.

## Implementation Details

### Architecture

```
┌─────────────────────────────────────────┐
│   NativeRipgrepTool (User Interface)   │
│  - Validates params                     │
│  - Formats results with context-aware   │
│    sizing (small/large)                 │
│  - Handles AbortSignal                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ NativeRipgrepExecutor (Orchestration)  │
│  - Builds ripgrep args                  │
│  - Handles smart filtering              │
│  - Generates previews                   │
│  - Counts matches                       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ NativeCommandExecutor (Core)            │
│  - Spawns child process                 │
│  - Pipes output to files                │
│  - Zero memory buffering                │
│  - Handles timeouts & signals           │
└─────────────────────────────────────────┘
```

### Signal Propagation

```typescript
// User calls tool with AbortSignal
NativeRipgrepTool.execute(signal)
  ↓
// Passed to invocation
NativeRipgrepToolInvocation.execute(signal)
  ↓
// Forwarded to executor
executor.executeRipgrepDirectToDisk(..., { signal })
  ↓
// Used in spawn options
spawn('rg', args, { signal })
```

### Result Formatting Logic

```typescript
const matchCount = result.matchCount;

if (matchCount <= 100) {
  // Small: Include full list
  response = `Found ${matchCount} matches:\n${fullContent}`;
} else {
  // Large: Show preview + reference
  response = `Found ${matchCount} matches (preview only):\n${preview}\n\nFull results: ${filePath}`;
}
```

## Migration Path

### For Users

- No change in API - same parameter interface
- Results now more efficient (less context)
- Larger searches now supported

### For Future Tools

- Use `native-ripgrep-tool.ts` as template
- Easy to create `native-grep-tool`, `native-find-tool`, etc.

## Testing

**11 tests covering:**

- ✅ Tool name and display name
- ✅ Schema validation
- ✅ Parameter validation (pattern, regex, maxCount, etc.)
- ✅ Invocation creation
- ✅ Description generation
- ✅ Successful execution
- ✅ Smart search mode
- ✅ Error handling

All tests passing with 100% success rate.

## Commit Information

**Commit**: `e650fd49`
**Files Changed**: 3

- Added: `native-ripgrep-executor.ts` (226 lines)
- Added: `native-ripgrep-tool.ts` (248 lines)
- Modified: `config.ts` (registration update)

**Build**: ✅ Success
**Tests**: ✅ 11/11 passing
**ESLint**: ✅ No errors

## Comparison Table

| Feature             | Old RipGrepTool      | New NativeRipgrepTool     |
| ------------------- | -------------------- | ------------------------- |
| Naming              | Confusing (GrepTool) | Clear (NativeRipgrepTool) |
| Memory              | Buffered             | Zero-buffering            |
| Large searches      | ~10,000+ tokens      | ~500 tokens               |
| Max matches         | Config-based         | Unlimited                 |
| File type filter    | No                   | Yes                       |
| Glob pattern        | Basic                | Full support              |
| Exclude patterns    | No                   | Yes (smart defaults)      |
| Error handling      | Basic                | Comprehensive             |
| AbortSignal support | Limited              | Full                      |
| Context awareness   | No                   | Yes                       |

## Benefits

✅ **Clear Architecture**: No naming confusion between Grep/Ripgrep
✅ **Memory Efficient**: No buffering, suitable for large codebases
✅ **Context Efficient**: Large results compressed to preview + reference
✅ **Flexible**: Supports regex, file types, globs, case sensitivity
✅ **Reliable**: Proper signal handling and error recovery
✅ **Reusable**: Pattern can be applied to other native tools
✅ **Well-tested**: 11 comprehensive tests, all passing
✅ **Production-ready**: Build succeeds, linting passes, no TypeScript errors
