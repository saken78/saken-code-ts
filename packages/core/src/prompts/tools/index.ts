/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolNames } from '../../tools/tool-names.js';

// Enhanced tool descriptions based on Claude's detailed tool descriptions
export const TOOL_DESCRIPTIONS: Record<string, string> = {
  [ToolNames.READ_FILE]: `
# Tool: ReadFile
Description: Reads content from a specified file. If the file is large, the content will be truncated. The tool's response will clearly indicate if truncation has occurred and will provide details on how to read more of the file using the 'offset' and 'limit' parameters. Handles text, images (PNG, JPG, GIF, WEBP, SVG, BMP), and PDF files. For text files, it can read specific line ranges.

Parameters:
- absolute_path: The absolute path to the file to read (e.g., '/home/user/project/file.txt'). Relative paths are not supported. You must provide an absolute path.
- limit: Optional: For text files, maximum number of lines to read. Use with 'offset' to paginate through large files. If omitted, reads the entire file (if feasible, up to a default limit).
- offset: Optional: For text files, the 0-based line number to start reading from. Requires 'limit' to be set. Use for paginating through large files.

Usage Notes:
- Always use absolute paths when referring to files
- For large files, consider reading specific sections using offset and limit parameters
- Verify file existence before requesting complex operations
  `,

  [ToolNames.WRITE_FILE]: `
# Tool: WriteFile
Description: Writes content to a specified file in the local filesystem.

Parameters:
- content: The content to write to the file.
- file_path: The absolute path to the file to write to (e.g., '/home/user/project/file.txt'). Relative paths are not supported.

Usage Notes:
- Always verify the intended file path before writing
- Consider backup strategies for important files
- Ensure proper file permissions after writing
  `,

  [ToolNames.EDIT]: `
# Tool: Edit
Description: Replaces text within a file. By default, replaces a single occurrence. Set 'replace_all' to true when you intend to modify every instance of 'old_string'. This tool requires providing significant context around the change to ensure precise targeting. Always use the read_file tool to examine the file's current content before attempting a text replacement.

Parameters:
- file_path: The absolute path to the file to modify. Must start with '/'.
- new_string: The exact literal text to replace 'old_string' with, preferably unescaped. Provide the EXACT text. Ensure the resulting code is correct and idiomatic.
- old_string: The exact literal text to replace, preferably unescaped. For single replacements (default), include at least 3 lines of context BEFORE and AFTER the target text, matching whitespace and indentation precisely. If this string is not the exact literal text (i.e. you escaped it) or does not match exactly, the tool will fail.
- replace_all: Replace all occurrences of old_string (default false).

Usage Notes:
- Include sufficient context (3+ lines before and after) for accurate replacements
- Verify old content exactly matches before making changes
- Use precise string matching to avoid unintended modifications
  `,

  [ToolNames.SHELL]: `
# Tool: Shell
Description: This tool executes a given shell command as 'bash -c <command>'. Command can start background processes using '&'. Command is executed as a subprocess that leads its own process group. Command process group can be terminated as 'kill -- -PGID' or signaled as 'kill -s SIGNAL -- -PGID'.

Parameters:
- command: Exact bash command to execute as 'bash -c <command>'
- description: Brief description of the command for the user. Be specific and concise. Ideally a single sentence. Can be up to 3 sentences for clarity. No line breaks.
- directory: (OPTIONAL) The absolute path of the directory to run the command in. If not provided, the project root directory is used. Must be a directory within the workspace and must already exist.
- is_background: Whether to run the command in background. Default is false. Set to true for long-running processes like development servers, watchers, or daemons that should continue running without blocking further commands.

Usage Notes:
- Always explain the purpose and potential impact of commands
- Consider security implications of executed commands
- Verify results after command execution
- Use background execution for long-running processes
  `,

  [ToolNames.TODO_WRITE]: `
# Tool: TodoWrite
Description: Use this tool to create and manage a structured task list for your current coding session. This helps you track progress, organize complex tasks, and demonstrate thoroughness to the user.

Parameters:
- todos: The updated todo list with items having content, id, and status (pending, in_progress, completed)

Usage Notes:
- Use for complex multi-step tasks
- Mark tasks as completed as soon as you finish them
- Limit yourself to one task marked as in_progress at a time
- Update task status in real-time as you work
  `,

  [ToolNames.GREP]: `
# Tool: Grep
Description: A powerful search tool built on ripgrep. Usage: - ALWAYS use Grep for search tasks. NEVER invoke 'grep' or 'rg' as a Bash command. The Grep tool has been optimized for correct permissions and access. - Supports full regex syntax (e.g., "log.*Error", "function\\{\\}") - Filter files with glob parameter (e.g., "*.js", "*.{ts,tsx}") - Use Task tool for open-ended searches requiring multiple rounds.

Parameters:
- pattern: The regular expression pattern to search for in file contents
- path: File or directory to search in (rg PATH). Defaults to current working directory.
- glob: Glob pattern to filter files (e.g. "*.js", "*.{ts,tsx}") - maps to rg --glob
- limit: Limit output to first N lines/entries. Optional - shows all matches if not specified.

Usage Notes:
- Use for content search using ripgrep
- Support full regex syntax for complex searches
- Filter files with glob parameter for targeted searches
  `,

  [ToolNames.GLOB]: `
# Tool: Glob
Description: Fast file pattern matching tool that works with any codebase size. Supports glob patterns like "**/*.js" or "src/**/*.ts". Returns matching file paths sorted by modification time. Use this tool when you need to find files by name patterns. When you are doing an open ended search that may require multiple rounds of globbing and grepping, use the Agent tool instead.

Parameters:
- pattern: The glob pattern to match files against
- path: The directory to search in. If not specified, the current working directory will be used.

Usage Notes:
- Use for file pattern matching and searching by name
- Supports complex glob patterns for flexible searching
- Returns matching file paths sorted by modification time
  `,

  [ToolNames.TASK]: `
# Tool: Task
Description: Launch a new agent to handle complex, multi-step tasks autonomously.

Available agent types and the tools they have access to:
- "memory-assistant": PROACTIVELY search Cipher memory before answering questions about past configurations, errors, solutions, or any "How did I..." type questions. MUST BE USED when user asks about previous work, setup details, troubleshooting, or stored knowledge.
- "general-purpose": General-purpose agent for researching complex questions, searching for code, and executing multi-step tasks. When you are searching for a keyword or file and are not confident that you will find the right match in the first few tries use this agent to perform the search for you.

Parameters:
- description: A short (3-5 word) description of the task
- prompt: The task for the agent to perform
- subagent_type: The type of specialized agent to use for this task

Usage Notes:
- Use for complex, multi-step tasks that require autonomy
- Specify the appropriate agent type for the task
- Provide clear, detailed instructions for the agent
- Monitor agent progress when possible
  `
};