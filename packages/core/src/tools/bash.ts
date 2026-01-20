/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import type { Config } from '../config/config.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import { ToolErrorType } from './tool-error.js';
import type { ToolInvocation, ToolResult, ToolResultDisplay } from './tools.js';
import { BaseDeclarativeTool, BaseToolInvocation, Kind } from './tools.js';
import { getErrorMessage } from '../utils/errors.js';
import type {
  ShellExecutionConfig,
  ShellOutputEvent,
} from '../services/shellExecutionService.js';
import { ShellExecutionService } from '../services/shellExecutionService.js';
import { formatMemoryUsage } from '../utils/formatters.js';
import type { AnsiOutput } from '../utils/terminalSerializer.js';
import { checkForDeprecatedCommands } from '../utils/deprecated-command-validator.js';
// import type pattern from 'ajv/dist/vocabularies/validation/pattern.js';

export const BASH_OUTPUT_UPDATE_INTERVAL_MS = 1000;

export interface BashToolParams {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  is_background?: boolean;
  description?: string;
  terminal?: {
    width?: number;
    height?: number;
    showColor?: boolean;
  };
}

export class BashToolInvocation extends BaseToolInvocation<
  BashToolParams,
  ToolResult
> {
  constructor(
    private readonly config: Config,
    params: BashToolParams,
  ) {
    super(params);
  }

  getDescription(): string {
    let description = `${this.params.command}`;

    if (this.params.cwd) {
      description += ` [in ${this.params.cwd}]`;
    }

    if (this.params.is_background) {
      description += ` [background]`;
    }

    if (this.params.description) {
      description += ` (${this.params.description.replaceAll(/\n/g, ' ')})`;
    }

    return description;
  }

  async execute(
    signal: AbortSignal,
    updateOutput?: (output: ToolResultDisplay) => void,
    shellExecutionConfig?: ShellExecutionConfig,
  ): Promise<ToolResult> {
    // Check for deprecated commands first
    const deprecatedCheck = checkForDeprecatedCommands(this.params.command);
    if (deprecatedCheck) {
      const tool = deprecatedCheck.recommendedTool;
      const errorMessage = `Use ${tool} tool instead of '${deprecatedCheck.command}'. ${deprecatedCheck.reason}`;
      return {
        llmContent: errorMessage,
        returnDisplay: errorMessage,
        error: {
          message: errorMessage,
          type: ToolErrorType.SHELL_EXECUTE_ERROR,
        },
      };
    }

    if (signal.aborted) {
      return {
        llmContent: 'Command was cancelled before execution.',
        returnDisplay: 'Cancelled',
      };
    }

    const cwd = this.params.cwd || this.config.getTargetDir();
    const shouldRunInBackground = this.params.is_background ?? false;

    // Prepare command for background execution
    let commandToExecute = this.params.command.trim();
    if (shouldRunInBackground && !commandToExecute.endsWith('&')) {
      commandToExecute = commandToExecute + ' &';
    }

    // Merge terminal configuration
    const baseConfig = this.config.getShellExecutionConfig();
    const terminalConfig: ShellExecutionConfig = {
      terminalWidth:
        this.params.terminal?.width ??
        shellExecutionConfig?.terminalWidth ??
        baseConfig.terminalWidth,
      terminalHeight:
        this.params.terminal?.height ??
        shellExecutionConfig?.terminalHeight ??
        baseConfig.terminalHeight,
      showColor:
        this.params.terminal?.showColor ??
        shellExecutionConfig?.showColor ??
        baseConfig.showColor,
      pager: shellExecutionConfig?.pager ?? baseConfig.pager,
    };

    let cumulativeOutput: string | AnsiOutput = '';
    let lastUpdateTime = Date.now();
    let isBinaryStream = false;

    const { result: resultPromise, pid } = await ShellExecutionService.execute(
      commandToExecute,
      cwd,
      (event: ShellOutputEvent) => {
        let shouldUpdate = false;

        switch (event.type) {
          case 'data':
            if (isBinaryStream) break;
            cumulativeOutput = event.chunk;
            shouldUpdate = true;
            break;
          case 'binary_detected':
            isBinaryStream = true;
            cumulativeOutput = '[Binary output detected. Halting stream...]';
            shouldUpdate = true;
            break;
          case 'binary_progress':
            isBinaryStream = true;
            cumulativeOutput = `[Receiving binary output... ${formatMemoryUsage(
              event.bytesReceived,
            )} received]`;
            if (Date.now() - lastUpdateTime > BASH_OUTPUT_UPDATE_INTERVAL_MS) {
              shouldUpdate = true;
            }
            break;
          default:
            throw new Error('Unhandled ShellOutputEvent type');
        }

        if (shouldUpdate && updateOutput) {
          updateOutput(
            typeof cumulativeOutput === 'string'
              ? cumulativeOutput
              : { ansiOutput: cumulativeOutput },
          );
          lastUpdateTime = Date.now();
        }
      },
      signal,
      this.config.getShouldUseNodePtyShell(),
      terminalConfig,
    );

    // Handle background execution
    if (shouldRunInBackground) {
      const pidMsg = pid ? ` PID: ${pid}` : '';
      const killHint = ' (Use kill <pid> to stop)';
      return {
        llmContent: `Background command started.${pidMsg}${killHint}`,
        returnDisplay: `Background command started.${pidMsg}${killHint}`,
      };
    }

    // Wait for foreground execution
    const result = await resultPromise;

    // Build result
    let llmContent = '';
    if (result.aborted) {
      llmContent = 'Command was cancelled by user.';
      if (result.output.trim()) {
        llmContent += ` Output before cancellation:\n${result.output}`;
      }
    } else {
      llmContent = [
        `Command: ${this.params.command}`,
        `Directory: ${cwd}`,
        `Output: ${result.output || '(empty)'}`,
        `Exit Code: ${result.exitCode ?? '(none)'}`,
        `Signal: ${result.signal ?? '(none)'}`,
      ].join('\n');
    }

    let returnDisplay = '';
    if (result.output.trim()) {
      returnDisplay = result.output;
    } else if (result.aborted) {
      returnDisplay = 'Command cancelled';
    } else if (result.signal) {
      returnDisplay = `Terminated by signal: ${result.signal}`;
    } else if (result.error) {
      returnDisplay = `Error: ${getErrorMessage(result.error)}`;
    } else if (result.exitCode !== null && result.exitCode !== 0) {
      returnDisplay = `Exited with code: ${result.exitCode}`;
    }

    const executionError = result.error
      ? {
          error: {
            message: result.error.message,
            type: ToolErrorType.SHELL_EXECUTE_ERROR,
          },
        }
      : {};

    return {
      llmContent,
      returnDisplay,
      ...executionError,
    };
  }
}

function getBashToolDescription(): string {
  return `Executes bash commands directly without permission checks or security restrictions.

**Use this tool when you need:**
- Direct, unrestricted command execution on Linux
- Pipeline operations (|, >, <, etc.)
- Complex bash features (process substitution, command chaining)
- Quick iteration without approval overhead

**Usage notes:**
- Commands execute as \`bash -c <command>\`
- No permission prompts or allowlists
- Full bash syntax supported
- Use \`is_background: true\` for long-running processes (e.g., dev servers, watchers, databases)
- Prefer absolute paths in \`cwd\` parameter
- **Always prefer modern Linux-native tools over POSIX equivalents**

**Preferred modern CLI tools (already installed):**
- File listing: \`eza\` (instead of \`ls\`)
- File viewing: \`bat\` (instead of \`cat\`)
- File search: \`fd\` (instead of \`find\`)
- Text search: \`rg\` (ripgrep, instead of \`grep\`)
- Disk usage: \`dust\` (instead of \`du\`)
- Process list: \`procs\` (instead of \`ps\`/top)
- HTTP requests: \`xh\` (instead of \`curl\`/wget)
- Diff viewer: \`delta\` (instead of plain \`diff\`)
- Directory jumping: \`zoxide\` (smarter \`cd\`)
- Count your code, quickly: \`tokei\`
- compressing and decompressing files and directories: \`ouch\`

## Examples:

## ouch example
A command-line utility for easily compressing and decompressing files and directories.

Usage: ouch [OPTIONS] <COMMAND>

Commands:
  compress    Compress one or more files into one output file [aliases: c]
  decompress  Decompresses one or more files, optionally into another folder [aliases: d]
  list        List contents of an archive [aliases: l, ls]
  help        Print this message or the help of the given subcommand(s)

Options:
  -y, --yes                  Skip [Y/n] questions, default to yes
  -n, --no                   Skip [Y/n] questions, default to no
  -A, --accessible           Activate accessibility mode, reducing visual noise [env: ACCESSIBLE=]
  -H, --hidden               Ignore hidden files
  -q, --quiet                Silence output
  -g, --gitignore            Ignore files matched by git's ignore files
  -f, --format <FORMAT>      Specify the format of the archive
  -p, --password <PASSWORD>  Decompress or list with password
  -c, --threads <THREADS>    Concurrent working threads

## tokey example
Count your code, quickly.

Usage: tokei [OPTIONS] [input]...

Arguments:
  [input]...  The path(s) to the file or directory to be counted. (default
              current directory)

Options:
  -c, --columns <columns>
          Sets a strict column width of the output, only available for
          terminal output.
  -e, --exclude <exclude>
          Ignore all files & directories matching the pattern.
  -f, --files
          Will print out statistics on individual files.
  -i, --input <file_input>
          Gives statistics from a previous tokei run. Can be given a file
          path, or "stdin" to read from stdin.
      --hidden
          Count hidden files.
  -l, --languages
          Prints out supported languages and their extensions.
      --no-ignore
          Don't respect ignore files (.gitignore, .ignore, etc.). This
          implies --no-ignore-parent, --no-ignore-dot, and --no-ignore-vcs.
      --no-ignore-parent
          Don't respect ignore files (.gitignore, .ignore, etc.) in parent
          directories.
      --no-ignore-dot
          Don't respect .ignore and .tokeignore files, including those in
          parent directories.
      --no-ignore-vcs
          Don't respect VCS ignore files (.gitignore, .hgignore, etc.)
          including those in parent directories.
  -o, --output <output>
          Outputs Tokei in a specific format. Compile with additional
          features for more format support.
      --streaming <streaming>
          prints the (language, path, lines, blanks, code, comments) records
          as simple lines or as Json for batch processing [possible values:
          simple, json]
  -s, --sort <sort>
          Sort languages based on column [possible values: files, lines,
          blanks, code, comments]
  -r, --rsort <rsort>
          Reverse sort languages based on column [possible values: files,
          lines, blanks, code, comments]
  -t, --types <types>
          Filters output by language type, separated by a comma. i.e.
          -t=Rust,Markdown
  -C, --compact
          Do not print statistics about embedded languages.
  -n, --num-format <num_format_style>
          Format of printed numbers, i.e., plain (1234, default), commas
          (1,234), dots (1.234), or underscores (1_234). Cannot be used with
          --output. [possible values: commas, dots, plain, underscores]
  -v, --verbose...
          Set log output level:
                                  1: to show unknown file extensions,
                                  2: reserved for future debugging,
                                  3: enable file level trace. Not
                                  recommended on multiple files

## fzf example
fzf is an interactive filter program for any kind of list.

It implements a "fuzzy" matching algorithm, so you can quickly type in patterns
with omitted characters and still get the results you want.

Project URL: https://github.com/junegunn/fzf
Author: Junegunn Choi <junegunn.c@gmail.com>

* See man page for more information: fzf --man

Usage: fzf [options]

  SEARCH
    -e, --exact              Enable exact-match
    +x, --no-extended        Disable extended-search mode
    -i, --ignore-case        Case-insensitive match
    +i, --no-ignore-case     Case-sensitive match
        --smart-case         Smart-case match (default)
    --scheme=SCHEME          Scoring scheme [default|path|history]
    -n, --nth=N[,..]         Comma-separated list of field index expressions
                             for limiting search scope. Each can be a non-zero
                             integer or a range expression ([BEGIN]..[END]).
    --with-nth=N[,..]        Transform the presentation of each line using
                             field index expressions
    --accept-nth=N[,..]      Define which fields to print on accept
    -d, --delimiter=STR      Field delimiter regex (default: AWK-style)
    +s, --no-sort            Do not sort the result
    --literal                Do not normalize latin script letters
    --tail=NUM               Maximum number of items to keep in memory
    --disabled               Do not perform search
    --tiebreak=CRI[,..]      Comma-separated list of sort criteria to apply
                             when the scores are tied
                             [length|chunk|pathname|begin|end|index] (default: length)

  INPUT/OUTPUT
    --read0                  Read input delimited by ASCII NUL characters
    --print0                 Print output delimited by ASCII NUL characters
    --ansi                   Enable processing of ANSI color codes
    --sync                   Synchronous search for multi-staged filtering

  GLOBAL STYLE
    --style=PRESET           Apply a style preset [default|minimal|full[:BORDER_STYLE]
    --color=COLSPEC          Base scheme (dark|light|base16|bw) and/or custom colors
    --no-color               Disable colors
    --no-bold                Do not use bold text

  DISPLAY MODE
    --height=[~]HEIGHT[%]    Display fzf window below the cursor with the given
                             height instead of using fullscreen.
                             A negative value is calculated as the terminal height
                             minus the given value.
                             If prefixed with '~', fzf will determine the height
                             according to the input size.
    --min-height=HEIGHT[+]   Minimum height when --height is given as a percentage.
                             Add '+' to automatically increase the value
                             according to the other layout options (default: 10+).
    --tmux[=OPTS]            Start fzf in a tmux popup (requires tmux 3.3+)
                             [center|top|bottom|left|right][,SIZE[%]][,SIZE[%]]
                             [,border-native] (default: center,50%)

  LAYOUT
    --layout=LAYOUT          Choose layout: [default|reverse|reverse-list]
    --margin=MARGIN          Screen margin (TRBL | TB,RL | T,RL,B | T,R,B,L)
    --padding=PADDING        Padding inside border (TRBL | TB,RL | T,RL,B | T,R,B,L)
    --border[=STYLE]         Draw border around the finder
                             [rounded|sharp|bold|block|thinblock|double|horizontal|vertical|
                              top|bottom|left|right|line|none] (default: rounded)
    --border-label=LABEL     Label to print on the border
    --border-label-pos=COL   Position of the border label
                             [POSITIVE_INTEGER: columns from left|
                              NEGATIVE_INTEGER: columns from right][:bottom]
                             (default: 0 or center)

  LIST SECTION
    -m, --multi[=MAX]        Enable multi-select with tab/shift-tab
    --highlight-line         Highlight the whole current line
    --cycle                  Enable cyclic scroll
    --wrap                   Enable line wrap
    --wrap-sign=STR          Indicator for wrapped lines
    --no-multi-line          Disable multi-line display of items when using --read0
    --raw                    Enable raw mode (show non-matching items)
    --track                  Track the current selection when the result is updated
    --tac                    Reverse the order of the input
    --gap[=N]                Render empty lines between each item
    --gap-line[=STR]         Draw horizontal line on each gap using the string
                             (default: '┈' or '-')
    --freeze-left=N          Number of fields to freeze on the left
    --freeze-right=N         Number of fields to freeze on the right
    --keep-right             Keep the right end of the line visible on overflow
    --scroll-off=LINES       Number of screen lines to keep above or below when
                             scrolling to the top or to the bottom (default: 0)
    --no-hscroll             Disable horizontal scroll
    --hscroll-off=COLS       Number of screen columns to keep to the right of the
                             highlighted substring (default: 10)
    --jump-labels=CHARS      Label characters for jump mode
    --gutter=CHAR            Character used for the gutter column (default: '▌')
    --gutter-raw=CHAR        Character used for the gutter column in raw mode (default: '▖')
    --pointer=STR            Pointer to the current line (default: '▌' or '>')
    --marker=STR             Multi-select marker (default: '┃' or '>')
    --marker-multi-line=STR  Multi-select marker for multi-line entries;
                             3 elements for top, middle, and bottom (default: '╻┃╹')
    --ellipsis=STR           Ellipsis to show when line is truncated (default: '··')
    --tabstop=SPACES         Number of spaces for a tab character (default: 8)
    --scrollbar[=C1[C2]]     Scrollbar character(s)
                             (each for list section and preview window)
    --no-scrollbar           Hide scrollbar
    --list-border[=STYLE]    Draw border around the list section
                             [rounded|sharp|bold|block|thinblock|double|horizontal|vertical|
                              top|bottom|left|right|none] (default: rounded)
    --list-label=LABEL       Label to print on the list border
    --list-label-pos=COL     Position of the list label
                             [POSITIVE_INTEGER: columns from left|
                              NEGATIVE_INTEGER: columns from right][:bottom]
                             (default: 0 or center)

  INPUT SECTION
    --no-input               Disable and hide the input section
    --prompt=STR             Input prompt (default: '> ')
    --info=STYLE             Finder info style
                             [default|right|hidden|inline[-right][:PREFIX]]
    --info-command=COMMAND   Command to generate info line
    --separator=STR          Draw horizontal separator on info line using the string
                             (default: '─' or '-')
    --no-separator           Hide info line separator
    --ghost=TEXT             Ghost text to display when the input is empty
    --filepath-word          Make word-wise movements respect path separators
    --input-border[=STYLE]   Draw border around the input section
                             [rounded|sharp|bold|block|thinblock|double|horizontal|vertical|
                              top|bottom|left|right|line|none] (default: rounded)
    --input-label=LABEL      Label to print on the input border
    --input-label-pos=COL    Position of the input label
                             [POSITIVE_INTEGER: columns from left|
                              NEGATIVE_INTEGER: columns from right][:bottom]
                             (default: 0 or center)

  PREVIEW WINDOW
    --preview=COMMAND        Command to preview highlighted line ({})
    --preview-window=OPT     Preview window layout (default: right:50%)
                             [up|down|left|right][,SIZE[%]]
                             [,[no]wrap][,[no]cycle][,[no]follow][,[no]info]
                             [,[no]hidden][,border-STYLE]
                             [,+SCROLL[OFFSETS][/DENOM]][,~HEADER_LINES]
                             [,default][,<SIZE_THRESHOLD(ALTERNATIVE_LAYOUT)]
    --preview-border[=STYLE] Short for --preview-window=border-STYLE
                             [rounded|sharp|bold|block|thinblock|double|horizontal|vertical|
                              top|bottom|left|right|line|none] (default: rounded)
    --preview-label=LABEL
    --preview-label-pos=N    Same as --border-label and --border-label-pos,
                             but for preview window

  HEADER
    --header=STR             String to print as header
    --header-lines=N         The first N lines of the input are treated as header
    --header-first           Print header before the prompt line
    --header-border[=STYLE]  Draw border around the header section
                             [rounded|sharp|bold|block|thinblock|double|horizontal|vertical|
                              top|bottom|left|right|line|none] (default: rounded)
    --header-lines-border[=STYLE]
                             Display header from --header-lines with a separate border.
                             Pass 'none' to still separate it but without a border.
    --header-label=LABEL     Label to print on the header border
    --header-label-pos=COL   Position of the header label
                             [POSITIVE_INTEGER: columns from left|
                              NEGATIVE_INTEGER: columns from right][:bottom]
                             (default: 0 or center)

  FOOTER
    --footer=STR             String to print as footer
    --footer-border[=STYLE]  Draw border around the footer section
                             [rounded|sharp|bold|block|thinblock|double|horizontal|vertical|
                              top|bottom|left|right|line|none] (default: line)
    --footer-label=LABEL     Label to print on the footer border
    --footer-label-pos=COL   Position of the footer label
                             [POSITIVE_INTEGER: columns from left|
                              NEGATIVE_INTEGER: columns from right][:bottom]
                             (default: 0 or center)

  SCRIPTING
    -q, --query=STR          Start the finder with the given query
    -1, --select-1           Automatically select the only match
    -0, --exit-0             Exit immediately when there's no match
    -f, --filter=STR         Print matches for the initial query and exit
    --print-query            Print query as the first line
    --expect=KEYS            Comma-separated list of keys to complete fzf

  KEY/EVENT BINDING
    --bind=BINDINGS          Custom key/event bindings

  ADVANCED
    --with-shell=STR         Shell command and flags to start child processes with
    --listen[=[ADDR:]PORT]   Start HTTP server to receive actions via TCP
                             (To allow remote process execution, use --listen-unsafe)
    --listen=SOCKET_PATH     Start HTTP server to receive actions via Unix domain socket
                             (Path should end with .sock)

  DIRECTORY TRAVERSAL        (Only used when $FZF_DEFAULT_COMMAND is not set)
    --walker=OPTS            [file][,dir][,follow][,hidden] (default: file,follow,hidden)
    --walker-root=DIR [...]  List of directories to walk (default: .)
    --walker-skip=DIRS       Comma-separated list of directory names to skip
                             (default: .git,node_modules)

  HISTORY
    --history=FILE           File to store fzf search history (*not* shell command history)
    --history-size=N         Maximum number of entries to keep in the file (default: 1000)

  SHELL INTEGRATION
    --bash                   Print script to set up Bash shell integration
    --zsh                    Print script to set up Zsh shell integration
    --fish                   Print script to set up Fish shell integration

  HELP
    --version                Display version information and exit
    --help                   Show this message
    --man                    Show man page

  ENVIRONMENT VARIABLES
    FZF_DEFAULT_COMMAND      Default command to use when input is tty
    FZF_DEFAULT_OPTS         Default options (e.g. '--layout=reverse --info=inline')
    FZF_DEFAULT_OPTS_FILE    Location of the file to read default options from
    FZF_API_KEY              X-API-Key header for HTTP server (--listen)

## fd example
## fd (Find Directory/File)

### Deskripsi
\`fd\` adalah program untuk mencari entri dalam sistem file Anda. Ini adalah alternatif modern untuk perintah \`find\` dengan sintaks yang lebih sederhana dan performa yang lebih cepat.

### Struktur Umum
\`\`\`
fd [OPTIONS] [pattern] [path...]
\`\`\`

### Opsi Umum

1. **Filter berdasarkan nama file**
   - \`fd "nama_file"\` - Cari file atau direktori dengan nama tertentu
   - \`fd -g "*.txt"\` - Cari file berdasarkan ekstensi menggunakan glob
   - \`fd -e txt\` - Cari file dengan ekstensi tertentu

2. **Filter berdasarkan jenis file**
   - \`fd -t f\` - Hanya cari file biasa
   - \`fd -t d\` - Hanya cari direktori
   - \`fd -t l\` - Hanya cari symbolic links

3. **Filter berdasarkan properti**
   - \`fd -H\` - Sertakan file dan direktori tersembunyi
   - \`fd -s\` - Cari dengan sensitivitas huruf besar/kecil
   - \`fd -i\` - Cari tanpa sensitivitas huruf besar/kecil

4. **Pembatasan lokasi dan kedalaman**
   - \`fd -d 2\` - Batasi pencarian maksimal 2 tingkat direktori
   - \`fd -E node_modules\` - Abaikan direktori \`node_modules\`

5. **Eksekusi perintah pada hasil**
   - \`fd -x ls -l\` - Eksekusi \`ls -l\` pada setiap hasil
   - \`fd -X grep "kata_kunci"\` - Jalankan \`grep\` pada semua hasil sekaligus

### Contoh-contoh Penggunaan

1. **Mencari file konfigurasi**
   \`\`\`bash
   fd ".config$" ~/
   \`\`\`
   Mencari semua file dengan akhiran \`.config\` di direktori home

2. **Mencari file tertentu dalam proyek**
   \`\`\`bash
   fd -e js -t f src/
   \`\`\`
   Mencari semua file JavaScript dalam direktori \`src/\`

3. **Menghitung jumlah file tertentu**
   \`\`\`bash
   fd -e py -t f | wc -l
   \`\`\`
   Menghitung jumlah file Python dalam direktori saat ini

4. **Menjalankan perintah pada hasil**
   \`\`\`bash
   fd -e log -x rm
   \`\`\`
   Menghapus semua file log dalam dan di bawah direktori saat ini

5. **Mencari dengan path lengkap**
   \`\`\`bash
   fd -p "**/node_modules/**/package.json"
   \`\`\`
   Mencari file \`package.json\` dalam direktori \`node_modules\` menggunakan path absolut

Perintah \`fd\` sangat berguna untuk pencarian cepat dalam struktur direktori besar karena menggunakan regex sebagai default dan mengabaikan file yang di-list dalam \`.gitignore\` secara otomatis.


## rg command example
- USAGE:
    rg [OPTIONS] PATTERN [PATH ...]
    rg [OPTIONS] -e PATTERN ... [PATH ...]
    rg [OPTIONS] --files [PATH ...]
    rg [OPTIONS] --type-list
    command | rg [OPTIONS] PATTERN
    rg [OPTIONS] --help
    rg [OPTIONS] --version

For the full documentation, run \`rg --help\` with no arguments.

SUMMARY OF OPTIONS:
    -h, --help                    Show a short help output
    -H, --help-all                Show a longer help output
    -V, --version                 Show version number

SEARCH OPTIONS:
    -e, --regexp PATTERN          Use PATTERN as a regular expression (default)
    -F, --fixed-strings           Treat PATTERN as a literal string
    -f, --file FILENAME           Search for patterns from a file
    -i, --ignore-case             Case insensitive search
    -L, --follow                  Follow symbolic links
    -n, --line-number             Show line numbers (1-based)
    -v, --invert-match            Show lines that don't match
    -w, --word-regexp             Only show matches surrounded by word boundaries
    -x, --line-regexp             Only show matches that cover an entire line
        --all                     Print all matches
        --dfa-size-limit SIZE     Set the upper size limit of the generated dfa
        --engine ENGINE           Choose which regex engine to use
        --max-hops NUM            Follow at most NUM symbolic links
        --max-match-distance NUM  The maximum distance between the start and end of a match
        --no-auto-hybrid-regex    Disable automatic regex engine selection
        --pcre2-unicode           Enable PCRE2's Unicode mode
        --regex-size-limit NUM    Specify the approximate maximum size of compiled regex

FILE FINDING OPTIONS:
    -g, --glob GLOB               Include files/directories matching GLOB
    -G, --iglob GLOB              Include files/directories matching GLOB (case-insensitive)
    -t, --type TYPE               Only search files matching TYPE
    -T, --type-not TYPE           Don't search files matching TYPE
    --type-add SPEC               Add a new file type
    --type-clear TYPE             Clear an existing file type
    --type-list                   Show all available file types
    -x, --exclude GLOB            Exclude files/directories matching GLOB
        --glob-case-insensitive   Process all glob patterns case insensitively
        --hidden                  Search hidden files and directories
        --ignore-file PATH        Specify additional ignore files
        --no-ignore               Don't respect .gitignore, .ignore or .rgignore files
        --no-ignore-dot           Don't respect .ignore or .rgignore files
        --no-ignore-exclude       Don't respect files specified via --exclude or -x
        --no-ignore-files         Don't respect --ignore-file flags
        --no-ignore-global        Don't respect global ignore files
        --no-ignore-parent        Don't respect ignore files in parent directories
        --no-ignore-vcs           Don't respect VCS ignore files (.gitignore, etc.)
        --no-require-git          Don't require a git repository to respect gitignores
        --no-unrestricted         Don't enable unrestricted search
        --require-git             Require a git repository to respect gitignores (default)
        --unrestricted            Reduce smart filtering (can be repeated)
        --files                   List files that would be searched
        --max-depth NUM           Limit directory traversal depth
        --max-filesize NUM+SUFFIX?  Ignore files larger than NUM in size

OUTPUT OPTIONS:
    -A, --after-context NUM       Show NUM lines after each match
    -B, --before-context NUM      Show NUM lines before each match
    -C, --context NUM             Show NUM lines before and after each match
    -c, --count                   Count the number of matching lines
        --count-matches           Count the number of matches
        --field-context-separator SEPARATOR  Set the field context separator
        --field-match-separator SEPARATOR    Set the field match separator
        --group-separator LINE    Set the group separator
        --heading                 Show the file path above clusters of matches (default)
        --include-zero            Include files in the output with no matches
        --line-buffered           Force line buffering
        --max-columns NUM         Don't print lines longer than this limit
        --max-columns-preview     Preview lines exceeding the configured max column limit
        --no-heading              Don't show the file path above clusters of matches
        --no-messages             Suppress error messages
        --null                    When printing file paths, follow each with a NUL byte
        --null-data               Treat input as a set of NUL-terminated lines
        --null-separator          Use NUL as the group separator
        --only-matching           Print only the matched (non-empty) parts of a matching line
        --passthru                Print both matching and non-matching lines
        --pretty                  Enable color, heading and line numbers
        --replace STRING          Replace matches with STRING
        --with-filename           Prefix each match with the file name
        --no-line-number          Suppress line numbers
        --column                  Show column numbers (1-based)
        --color WHEN              Controls when to use color
        --colors SPEC             Configure color settings
        --stats                   Print statistics about the search

MISCELLANEOUS OPTIONS:
    -0, --null                    When printing file paths, follow each with a NUL byte
    -a, --text                    Search binary files as if they were text
    -D, --dfa-size-limit SIZE     Specify the upper size limit of the generated dfa
    -m, --max-count NUM           Limit the number of matches to NUM
    -M, --max-columns NUM         Don't search lines longer than NUM (default: 150)
    -N, --no-line-number          Suppress line numbers
    -O, --only-matching           Print only the matched (non-empty) parts of a matching line
    -p, --pretty                  Enable color, heading and line numbers
    -q, --quiet                   Do not print anything to stdout
    -r, --replace STRING          Replace matches with STRING
    -s, --no-messages             Suppress error messages
    -S, --smart-case              Smart case matching
    -z, --search-zip              Search in compressed files
    --all                         Print all matches
    --auto-hybrid-regex           Automatically choose between regex engines (default)
    --binary                      Search binary files
    --debug                       Show debug messages
    --epilogue-separator LINE     Set the epilogue separator
    --generate TYPE               Generate sample configuration files
    --ignore-case                 Case-insensitive matching
    --line-buffered               Force line buffering
    --sort SORTBY                 Sort results in ascending order
    --sortr SORTBY                Sort results in descending order
    --trace                       Show trace messages
    --vimgrep                     Show results in vim-compatible format
    --json                        Show results in JSON format
        --type-list               Show all available file types
        --version                 Print version

GLOBAL OPTIONS:
    -j, --threads NUM             Number of threads to use for searching

ENVIRONMENT VARIABLES:
    RIPGREP_CONFIG_PATH    Path to a file which contains ripgrep options.
    RIPGREP_NOT_BINARY     When set, ripgrep will not attempt to skip binary files.
    RIPGREP_PCRE2          When set, ripgrep will use PCRE2 for regex matching.
    RIPGREP_SMART_CASE     When set, ripgrep will use smart case matching.
    RIPGREP_THREADS        Number of threads to use for searching.
    RIPGREP_VIMGREP        When set, ripgrep will use vim-compatible output format.
    RIPGREP_AUTO_HYBRID_REGEX  When set, ripgrep will automatically choose between regex engines.

FILES:
    ~/.ripgreprc                    Configuration file
    $RIPGREP_CONFIG_PATH            Alternate configuration file

## zoxide
A smarter cd command for your terminal

Usage:
  zoxide <COMMAND>

Commands:
  add     Add a new directory or increment its rank
  edit    Edit the database
  import  Import entries from another application
  init    Generate shell configuration
  query   Search for a directory in the database
  remove  Remove a directory from the database

Options:
  -h, --help     Print help
  -V, --version  Print version

Environment variables:
  _ZO_DATA_DIR          Path for zoxide data files
  _ZO_ECHO              Print the matched directory before navigating to it when set to 1
  _ZO_EXCLUDE_DIRS      List of directory globs to be excluded
  _ZO_FZF_OPTS          Custom flags to pass to fzf
  _ZO_MAXAGE            Maximum total age after which entries start getting deleted
  _ZO_RESOLVE_SYMLINKS  Resolve symlinks when storing paths

- \`fd -e ts -X bat\`
- \`dust -d 2 /home/user/project\`
- \`procs --sortd mem\`
- \`xh :3000/api/status\`
- \`eza -la --git --icons\`
- \`zoxide init fish | source && z myproj\`

**When to use run_shell_command (ShellTool) instead:**
- When you need permission tracking and allowlists
- For git commits that need co-author attribution
- In untrusted or production environments
- When security audit trails are required`;
}

export class BashTool extends BaseDeclarativeTool<BashToolParams, ToolResult> {
  static Name: string = ToolNames.BASH;

  constructor(private readonly config: Config) {
    super(
      BashTool.Name,
      ToolDisplayNames.BASH,
      getBashToolDescription(),
      Kind.Execute,
      {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Bash command to execute directly',
          },
          cwd: {
            type: 'string',
            description:
              'Working directory (absolute path). Defaults to project root.',
          },
          env: {
            type: 'object',
            description: 'Additional environment variables',
            additionalProperties: { type: 'string' },
          },
          is_background: {
            type: 'boolean',
            description:
              'Run in background. Default: false. Set to true for long-running processes.',
          },
          description: {
            type: 'string',
            description: 'Brief description of command purpose',
          },
          terminal: {
            type: 'object',
            description: 'Terminal configuration overrides',
            properties: {
              width: {
                type: 'number',
                description: 'Terminal width in columns',
              },
              height: {
                type: 'number',
                description: 'Terminal height in rows',
              },
              showColor: {
                type: 'boolean',
                description: 'Enable colored output',
              },
            },
          },
        },
        required: ['command'],
      } as Record<string, unknown>,
      false, // not markdown
      true, // can update output
    );
  }

  /**
   * Detects if a bash command is attempting to edit or create files
   * Blocks commands that should use dedicated tools instead
   */
  private detectFileEditOrCreateOperation(command: string): string | null {
    const trimmed = command.trim();

    // Block file write/redirect operations
    // Pattern: echo/printf/cat > file or >> file
    if (
      /\b(echo|printf|cat)\b.*\s[>>&]+\s|^\s*[>>&]/.test(trimmed) ||
      trimmed.includes('>')
    ) {
      return `Cannot use bash redirection (> >>) to create/edit files. Use write-file tool instead.`;
    }

    // Block here-documents (cat <<EOF)
    if (/\b(cat|<<)\b/.test(trimmed) && trimmed.includes('<<')) {
      return `Cannot use here-documents to create files. Use write-file tool instead.`;
    }

    // Block sed (stream editor)
    if (/\bsed\b/.test(trimmed)) {
      return `Use edit tool instead of sed for file modifications.`;
    }

    // Block awk file operations
    if (/\bawk\b.*>/.test(trimmed)) {
      return `Use edit tool instead of awk for file modifications.`;
    }

    // Block tee (write to file)
    if (/\btee\b/.test(trimmed) && trimmed !== 'tee') {
      // Allow tee only for piping to stdout, reject if writing to file
      const teeArgs = trimmed.split(/\btee\b/)[1] || '';
      if (
        teeArgs.trim() &&
        !teeArgs.startsWith('|') &&
        !teeArgs.includes('-')
      ) {
        return `Use edit tool instead of tee for writing to files.`;
      }
    }

    // Block vim/nano/emacs (interactive editors)
    if (/\b(vim|vi|nano|emacs|ed)\b/.test(trimmed)) {
      return `Cannot use interactive editors in bash. Use edit tool for file modifications.`;
    }

    return null;
  }

  protected override validateToolParamValues(
    params: BashToolParams,
  ): string | null {
    // Minimal validation - just ensure command is not empty
    if (!params.command.trim()) {
      return 'Command cannot be empty';
    }

    // Check for file edit/create operations that should use dedicated tools
    const fileOpError = this.detectFileEditOrCreateOperation(params.command);
    if (fileOpError) {
      return fileOpError;
    }

    // Validate cwd if provided
    if (params.cwd) {
      if (!path.isAbsolute(params.cwd)) {
        return 'Working directory must be an absolute path';
      }

      // Check if directory exists
      try {
        const stats = fs.statSync(params.cwd);
        if (!stats.isDirectory()) {
          return `Path exists but is not a directory: ${params.cwd}`;
        }
      } catch (err) {
        return `Directory does not exist: ${params.cwd}`;
      }

      // Check if within workspace
      const workspaceDirs = this.config.getWorkspaceContext().getDirectories();
      const isWithinWorkspace = workspaceDirs.some((wsDir) =>
        params.cwd!.startsWith(wsDir),
      );

      if (!isWithinWorkspace) {
        return `Directory is not within workspace: ${params.cwd}`;
      }
    }

    return null;
  }

  protected createInvocation(
    params: BashToolParams,
  ): ToolInvocation<BashToolParams, ToolResult> {
    return new BashToolInvocation(this.config, params);
  }
}
