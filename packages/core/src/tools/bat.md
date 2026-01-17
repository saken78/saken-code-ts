# Bat Tool for Qwen Code

The `bat` tool is a cat(1) clone with syntax highlighting and Git integration. This tool displays file contents with various formatting options including syntax highlighting, line numbers, Git differences, and more. It supports many customization options for appearance and behavior.

## Features

- **Syntax Highlighting**: Automatic syntax highlighting for many programming languages
- **Git Integration**: Show Git changes and differences
- **Line Numbers**: Display line numbers alongside file contents
- **Non-printable Characters**: Visualize spaces, tabs, and other non-printable characters
- **Themes**: Customize the color theme for syntax highlighting
- **Line Ranges**: Display specific ranges of lines from files
- **Paging Support**: Automatic paging for large files

## Usage

### Basic Usage

```json
{
  "file_paths": ["/absolute/path/to/file"]
}
```

### Advanced Usage Examples

#### Show file with syntax highlighting and line numbers

```json
{
  "file_paths": ["/path/to/file.py"],
  "language": "python",
  "number": true,
  "theme": "GitHub"
}
```

#### Highlight specific lines

```json
{
  "file_paths": ["/path/to/file.js"],
  "highlight_line": "10:15"
}
```

#### Show only Git changes

```json
{
  "file_paths": ["/path/to/file.txt"],
  "diff": true
}
```

#### List available languages

```json
{
  "file_paths": ["-"],
  "list_languages": true
}
```

#### List available themes

```json
{
  "file_paths": ["-"],
  "list_themes": true
}
```

#### Show specific line range

```json
{
  "file_paths": ["/path/to/file.rs"],
  "line_range": "10:20"
}
```

#### Show non-printable characters

```json
{
  "file_paths": ["/path/to/file.txt"],
  "show_all": true
}
```

## Parameters

| Parameter               | Type     | Description                                                                      |
| ----------------------- | -------- | -------------------------------------------------------------------------------- |
| `file_paths`            | string[] | **Required**. File(s) to print / concatenate. Use "-" for stdin.                 |
| `show_all`              | boolean  | Show non-printable characters like space, tab or newline.                        |
| `nonprintable_notation` | string   | Set notation for non-printable characters: 'unicode' or 'caret'.                 |
| `binary`                | string   | How to treat binary content: 'no-printing' or 'as-text'.                         |
| `plain`                 | boolean  | Only show plain style, no decorations.                                           |
| `language`              | string   | Explicitly set the language for syntax highlighting.                             |
| `highlight_line`        | string   | Highlight specific line ranges (e.g., "40", "30:40", ":40", "40:", "30:+10").    |
| `file_name`             | string   | Specify the name to display for a file when piping from STDIN.                   |
| `diff`                  | boolean  | Only show lines that have been added/removed/modified with respect to Git index. |
| `diff_context`          | number   | Include N lines of context around Git changes.                                   |
| `tabs`                  | number   | Set tab width to T spaces (use 0 to pass tabs through directly).                 |
| `wrap`                  | string   | Text wrapping mode: 'auto', 'never', 'character'.                                |
| `chop_long_lines`       | boolean  | Truncate lines longer than screen width.                                         |
| `terminal_width`        | number   | Explicitly set terminal width.                                                   |
| `number`                | boolean  | Only show line numbers, no other decorations.                                    |
| `color`                 | string   | When to use colored output: 'auto', 'never', 'always'.                           |
| `italic_text`           | string   | When to use italic text: 'always', 'never'.                                      |
| `decorations`           | string   | When to use decorations: 'auto', 'never', 'always'.                              |
| `force_colorization`    | boolean  | Force colorization even when piping.                                             |
| `paging`                | string   | When to use pager: 'auto', 'never', 'always'.                                    |
| `pager`                 | string   | Specify which pager to use.                                                      |
| `map_syntax`            | string   | Map glob patterns to syntax names (e.g., '\*.build:Python').                     |
| `ignored_suffix`        | string   | Ignore file suffixes (e.g., '.dev' for 'file.json.dev').                         |
| `theme`                 | string   | Set theme for syntax highlighting.                                               |
| `theme_light`           | string   | Theme for light backgrounds.                                                     |
| `theme_dark`            | string   | Theme for dark backgrounds.                                                      |
| `list_themes`           | boolean  | Display list of available themes.                                                |
| `squeeze_blank`         | boolean  | Squeeze consecutive empty lines.                                                 |
| `squeeze_limit`         | number   | Maximum consecutive empty lines to print.                                        |
| `strip_ansi`            | string   | When to strip ANSI sequences: 'auto', 'always', 'never'.                         |
| `style`                 | string   | Components to display: 'full', 'plain', 'numbers', 'changes', 'grid', etc.       |
| `line_range`            | string   | Range of lines to display (e.g., "30:40", ":40", "40:", "-10:").                 |
| `list_languages`        | boolean  | Display list of supported languages.                                             |
| `set_terminal_title`    | boolean  | Set terminal title to filenames when using pager.                                |

## Security Notes

- Only absolute file paths are accepted
- Files must be within the workspace directory or temporary directories
- Files ignored by `.qwenignore` patterns cannot be accessed
- The tool respects the same security constraints as other file access tools

## Examples

### Display a source file with syntax highlighting

```json
{
  "file_paths": ["/home/user/project/src/main.ts"],
  "language": "typescript",
  "theme": "GitHub",
  "number": true
}
```

### Show Git changes in a file

```json
{
  "file_paths": ["/home/user/project/package.json"],
  "diff": true,
  "diff_context": 3
}
```

### Display only lines 50-60 of a large file

```json
{
  "file_paths": ["/home/user/project/large-file.log"],
  "line_range": "50:60"
}
```

### Highlight critical lines in a configuration file

```json
{
  "file_paths": ["/home/user/project/config.json"],
  "highlight_line": "15:20,30:35",
  "theme": "Monokai"
}
```

## Troubleshooting

- If you get "File does not exist" error, ensure the file exists and you're using an absolute path
- If syntax highlighting doesn't work, try specifying the language explicitly with the `language` parameter
- For issues with large files, consider using `line_range` to limit output
- If you're having trouble with special characters, try using `show_all` to visualize non-printable characters
