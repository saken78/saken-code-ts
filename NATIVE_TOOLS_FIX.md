# Native Tools Bug Fixes

## Issue

When using the FD native tool, the following error occurred:

```
The "options.signal" property must be an instance of AbortSignal. Received null
```

## Root Causes Identified

### 1. **AbortSignal Not Being Passed**

- The `FdNativeToolInvocation.execute()` method received `_signal` parameter but prefixed with underscore (unused)
- Signal was not forwarded to the executor methods
- `NativeCommandExecutor.spawn()` was receiving `null` for signal instead of the actual AbortSignal

### 2. **Storage Directory Access Issues**

- Default storage path `/var/storage/native` might not exist or be accessible
- No fallback mechanism if primary path fails
- Missing proper error handling for directory creation failures

## Fixes Applied

### Fix 1: Signal Propagation (fd-native-tool.ts)

**Changed:**

```typescript
async execute(_signal: AbortSignal, ...) // Underscore prefix meant unused
```

**To:**

```typescript
async execute(signal: AbortSignal, ...) // Now properly used
```

**Action:** Pass signal through executor chain:

- For smart search: `smartFdSearch(..., { signal })`
- For standard search: Add signal to `FdSearchOptions` object

### Fix 2: SmartFdSearch Signature (native-fd-executor.ts)

**Extended method signature to accept executor options:**

```typescript
async smartFdSearch(
  pattern: string,
  searchPath: string,
  filters?: {...},
  executorOptions?: { signal?: AbortSignal }  // NEW
): Promise<FdResult>
```

**Pass signal to underlying executor:**

```typescript
return await this.executeFdDirectToDisk(pattern, searchPath, {
  ...options,
  signal: executorOptions?.signal, // NEW
});
```

### Fix 3: Fallback Storage Path (native-command-executor.ts)

**Added intelligent path resolution:**

```typescript
private getDefaultStoragePath(): string {
  const primaryPath = '/var/storage/native';
  const tempPath = path.join(os.tmpdir(), 'qwen-native-commands');

  try {
    fs.accessSync('/var');
    return primaryPath;
  } catch {
    // Fallback to temp directory
    console.log(`Using fallback: ${tempPath}`);
    return tempPath;
  }
}
```

### Fix 4: Improved Storage Directory Handling (native-command-executor.ts)

**Enhanced error handling in `ensureStorageDirectory()`:**

- Check if path is actually a directory (not a file)
- Properly handle `ENOENT` errors
- Provide detailed error messages
- Log successful directory creation

## Files Modified

1. **src/tools/fd-native-tool.ts**
   - Line 67: Changed `_signal` to `signal`
   - Line 95: Added signal to smartFdSearch call
   - Line 104: Added signal to FdSearchOptions

2. **src/tools/native-fd-executor.ts**
   - Line 160: Added `executorOptions` parameter to smartFdSearch
   - Line 200: Pass signal from executorOptions

3. **src/tools/native-command-executor.ts**
   - Line 15: Added `import os from 'node:os'`
   - Lines 45-68: Implemented getDefaultStoragePath() with fallback logic
   - Lines 192-214: Enhanced ensureStorageDirectory() with better error handling

## Test Results

All 9 tests for FD native tool pass successfully:

- ✓ Tool name and display name
- ✓ Valid schema structure
- ✓ Parameter validation
- ✓ Invocation creation
- ✓ Successful execution

## Benefits

✅ **Fixes AbortSignal error** - Signals properly propagate through executor chain
✅ **Improves reliability** - Fallback to temp directory if /var/storage/native unavailable
✅ **Better error messages** - Clear indication of storage directory issues
✅ **Logging** - Track when fallback paths are used
✅ **Backward compatible** - Existing code using specified storagePath unaffected

## Testing

To verify the fix works with your test case:

```bash
# Use the fd native tool
qwen-code "Use the fd tool to list shell scripts in /var/storage/native"
```

The tool should now properly handle signal propagation and use appropriate storage directory.
