/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tool name constants to avoid circular dependencies.
 * These constants are used across multiple files and should be kept in sync
 * with the actual tool class names.
 */
export const ToolNames = {
  SMART_EDIT: 'smart_edit',
  EDIT: 'edit',
  WRITE_FILE: 'write_file',
  READ_FILE: 'read_file',
  READ_MANY_FILES: 'read_many_files',
  GREP: 'grep_search',
  GLOB: 'glob',
  SHELL: 'shell', // in the future changes to fish
  BASH: 'bash',
  TODO_WRITE: 'todo_write',
  MEMORY: 'save_memory',
  TASK: 'task',
  SKILL: 'skill',
  EXIT_PLAN_MODE: 'exit_plan_mode',
  WEB_FETCH: 'web_fetch',
  WEB_SEARCH: 'web_search',
  LS: 'list_directory',
  // FD: 'fd',
  BAT: 'bat',
  EZA: 'eza',
  NATIVE_EZA: 'native_eza',
  NATIVE_FD: 'native_fd',
  RIPGREP: 'rg',
  JQ: 'jq',
  YQ: 'yq',
} as const;

/**
 * Tool display name constants to avoid circular dependencies.
 * These constants are used across multiple files and should be kept in sync
 * with the actual tool display names.
 */
export const ToolDisplayNames = {
  SMART_EDIT: 'SmartEdit',
  EDIT: 'Edit',
  WRITE_FILE: 'WriteFile',
  READ_FILE: 'ReadFile',
  READ_MANY_FILES: 'ReadManyFiles',
  GREP: 'Grep',
  GLOB: 'Glob',
  SHELL: 'Shell',
  BASH: 'Bash',
  TODO_WRITE: 'TodoWrite',
  MEMORY: 'SaveMemory',
  TASK: 'Task',
  SKILL: 'Skill',
  EXIT_PLAN_MODE: 'ExitPlanMode',
  WEB_FETCH: 'WebFetch',
  WEB_SEARCH: 'WebSearch',
  LS: 'ListFiles',
  // FD: 'Fd',
  BAT: 'Bat',
  EZA: 'Eza',
  NATIVE_EZA: 'NativeEza',
  NATIVE_FD: 'NativeFD',
  RIPGREP: 'Ripgrep',
  JQ: 'Jq',
  YQ: 'Yq',
} as const;

// Migration from old tool names to new tool names
// These legacy tool names were used in earlier versions and need to be supported
// for backward compatibility with existing user configurations
export const ToolNamesMigration = {
  search_file_content: ToolNames.GREP, // Legacy name from grep tool
  replace: ToolNames.EDIT, // Legacy name from edit tool
} as const;

// Migration from old tool display names to new tool display names
// These legacy display names were used before the tool naming standardization
export const ToolDisplayNamesMigration = {
  SearchFiles: ToolDisplayNames.GREP, // Old display name for Grep
  FindFiles: ToolDisplayNames.GLOB, // Old display name for Glob
  ReadFolder: ToolDisplayNames.LS, // Old display name for ListFiles
} as const;

/**
 * Tool name aliases for backward compatibility and user convenience.
 * Maps short/common names to canonical tool names.
 * Used by agent configurations and tool resolution logic.
 */
export const ToolAliases: Record<string, string> = {
  // Common short names mapping to canonical names
  grep: ToolNames.GREP, // 'grep' -> 'grep_search'
  shell: ToolNames.SHELL, // 'shell' -> 'shell'
  bash: ToolNames.BASH, // 'bash' -> 'bash'
  todo_write: ToolNames.TODO_WRITE,
  todo: ToolNames.TODO_WRITE, // Alternative name
  edit: ToolNames.EDIT,
  write: ToolNames.WRITE_FILE, // 'write' -> 'write_file'
  read: ToolNames.READ_FILE, // 'read' -> 'read_file'
  glob: ToolNames.GLOB,
  search: ToolNames.GREP, // 'search' -> 'grep_search'
  find: ToolNames.GLOB, // 'find' -> 'glob'
  ls: ToolNames.LS, // 'ls' -> 'list_directory'
  list: ToolNames.LS, // 'list' -> 'list_directory'
  memory: ToolNames.MEMORY, // 'memory' -> 'save_memory'
  save: ToolNames.MEMORY, // 'save' -> 'save_memory'
  // fd: ToolNames.FD, // 'fd' -> 'fd'
  bat: ToolNames.BAT, // 'bat' -> 'bat'
  eza: ToolNames.EZA, // 'eza' -> 'eza'
  native_eza: ToolNames.NATIVE_EZA, // 'native_eza' -> 'native_eza'
  native_fd: ToolNames.NATIVE_FD,
  RIPGREP: ToolNames.RIPGREP, // RG
  SmartEdit: ToolNames.SMART_EDIT, // Smart Edit
  jq: ToolNames.JQ, // Jq
  yq: ToolNames.YQ, // Yq
} as const;
