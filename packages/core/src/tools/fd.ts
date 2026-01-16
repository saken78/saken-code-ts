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
import { execa } from 'execa';
// import { createWriteStream, promises as fsPromises } from 'fs';
// import { pipeline } from 'stream/promises';
// import type { Readable } from 'stream';

export interface FdToolParams {
  pattern?: string;
  path?: string;
  hidden?: boolean;
  no_ignore?: boolean;
  no_ignore_vcs?: boolean;
  no_require_git?: boolean;
  no_ignore_parent?: boolean;
  unrestricted?: boolean;
  case_sensitive?: boolean;
  ignore_case?: boolean;
  glob?: boolean;
  regex?: boolean;
  fixed_strings?: boolean;
  and?: string[];
  absolute_path?: boolean;
  list_details?: boolean;
  follow?: boolean;
  full_path?: boolean;
  print0?: boolean;
  max_depth?: number;
  min_depth?: number;
  exact_depth?: number;
  exclude?: string[];
  prune?: boolean;
  type?: Array<
    | 'f'
    | 'file'
    | 'd'
    | 'dir'
    | 'directory'
    | 'l'
    | 'symlink'
    | 's'
    | 'socket'
    | 'p'
    | 'pipe'
    | 'b'
    | 'block-device'
    | 'c'
    | 'char-device'
    | 'x'
    | 'executable'
    | 'e'
    | 'empty'
  >;
  extension?: string[];
  size?: string;
  changed_within?: string;
  changed_before?: string;
  owner?: string;
  exec?: string[];
  exec_batch?: string[];
  batch_size?: number;
  ignore_file?: string;
  color?: 'auto' | 'always' | 'never';
  hyperlink?: 'auto' | 'always' | 'never';
  threads?: number;
  max_results?: number;
  quiet?: boolean;
  show_errors?: boolean;
  base_directory?: string;
  path_separator?: string;
  search_path?: string[];
  strip_cwd_prefix?: 'auto' | 'always' | 'never';
  one_file_system?: boolean;
}

export class FdToolInvocation extends BaseToolInvocation<
  FdToolParams,
  ToolResult
> {
  constructor(
    private readonly config: Config,
    params: FdToolParams,
  ) {
    super(params);
  }

  getDescription(): string {
    const { pattern, path, type, extension, size } = this.params;
    let description = 'Find files using fd';

    if (pattern) {
      description += ` with pattern "${pattern}"`;
    }

    if (path) {
      description += ` in path "${path}"`;
    }

    if (type && type.length > 0) {
      description += ` of type ${type.join(', ')}`;
    }

    if (extension && extension.length > 0) {
      description += ` with extension ${extension.map((ext) => `.${ext}`).join(', ')}`;
    }

    if (size) {
      description += ` with size "${size}"`;
    }

    return description;
  }

  async execute(
    signal: AbortSignal,
    updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult> {
    if (signal.aborted) {
      return {
        llmContent: 'Command was cancelled before execution.',
        returnDisplay: 'Cancelled',
      };
    }

    try {
      // Build fd command arguments
      const args: string[] = [];

      // Add flags
      if (this.params.hidden) args.push('--hidden');
      if (this.params.no_ignore) args.push('--no-ignore');
      if (this.params.no_ignore_vcs) args.push('--no-ignore-vcs');
      if (this.params.no_require_git) args.push('--no-require-git');
      if (this.params.no_ignore_parent) args.push('--no-ignore-parent');
      if (this.params.unrestricted) args.push('--unrestricted');
      if (this.params.case_sensitive) args.push('--case-sensitive');
      if (this.params.ignore_case) args.push('--ignore-case');
      if (this.params.glob) args.push('--glob');
      if (this.params.regex) args.push('--regex');
      if (this.params.fixed_strings) args.push('--fixed-strings');
      if (this.params.absolute_path) args.push('--absolute-path');
      if (this.params.list_details) args.push('--list-details');
      if (this.params.follow) args.push('--follow');
      if (this.params.full_path) args.push('--full-path');
      if (this.params.print0) args.push('--print0');
      if (this.params.prune) args.push('--prune');

      // Add numeric options
      if (this.params.max_depth !== undefined) {
        args.push('--max-depth', this.params.max_depth.toString());
      }
      if (this.params.min_depth !== undefined) {
        args.push('--min-depth', this.params.min_depth.toString());
      }
      if (this.params.exact_depth !== undefined) {
        args.push('--exact-depth', this.params.exact_depth.toString());
      }
      if (this.params.batch_size !== undefined) {
        args.push('--batch-size', this.params.batch_size.toString());
      }
      if (this.params.threads !== undefined) {
        args.push('--threads', this.params.threads.toString());
      }
      if (this.params.max_results !== undefined) {
        args.push('--max-results', this.params.max_results.toString());
      }

      // Add string options
      if (this.params.size) args.push('--size', this.params.size);
      if (this.params.changed_within)
        args.push('--changed-within', this.params.changed_within);
      if (this.params.changed_before)
        args.push('--changed-before', this.params.changed_before);
      if (this.params.owner) args.push('--owner', this.params.owner);
      if (this.params.ignore_file)
        args.push('--ignore-file', this.params.ignore_file);
      if (this.params.color) args.push('--color', this.params.color);
      if (this.params.hyperlink)
        args.push('--hyperlink', this.params.hyperlink);
      if (this.params.path_separator)
        args.push('--path-separator', this.params.path_separator);
      if (this.params.base_directory)
        args.push('--base-directory', this.params.base_directory);
      if (this.params.strip_cwd_prefix)
        args.push('--strip-cwd-prefix', this.params.strip_cwd_prefix);

      // Add array options
      if (this.params.and && this.params.and.length > 0) {
        this.params.and.forEach((andPattern) => {
          args.push('--and', andPattern);
        });
      }

      if (this.params.exclude && this.params.exclude.length > 0) {
        this.params.exclude.forEach((excludePattern) => {
          args.push('--exclude', excludePattern);
        });
      }

      if (this.params.type && this.params.type.length > 0) {
        this.params.type.forEach((fileType) => {
          args.push('--type', fileType);
        });
      }

      if (this.params.extension && this.params.extension.length > 0) {
        this.params.extension.forEach((ext) => {
          args.push('--extension', ext);
        });
      }

      if (this.params.exec && this.params.exec.length > 0) {
        args.push('--exec', ...this.params.exec);
      }

      if (this.params.exec_batch && this.params.exec_batch.length > 0) {
        args.push('--exec-batch', ...this.params.exec_batch);
      }

      if (this.params.search_path && this.params.search_path.length > 0) {
        this.params.search_path.forEach((searchPath) => {
          args.push('--search-path', searchPath);
        });
      }

      // Add pattern and path
      if (this.params.pattern) {
        args.push(this.params.pattern);
      }

      if (this.params.path) {
        args.push(this.params.path);
      }

      // Determine target directory
      let targetDir = this.config.getTargetDir();
      if (this.params.base_directory) {
        targetDir = this.params.base_directory;
      } else if (this.params.path) {
        // If path is provided and is absolute, use it directly; otherwise join with target dir
        if (path.isAbsolute(this.params.path)) {
          targetDir = this.params.path;
        } else {
          targetDir = path.join(targetDir, this.params.path);
        }
      }

      // Validate target directory
      try {
        const stats = fs.statSync(targetDir);
        if (!stats.isDirectory()) {
          return {
            llmContent: `Error: Path exists but is not a directory: ${targetDir}`,
            returnDisplay: `Error: Path exists but is not a directory: ${targetDir}`,
            error: {
              message: `Path exists but is not a directory: ${targetDir}`,
              type: ToolErrorType.FD_EXECUTION_ERROR,
            },
          };
        }
      } catch (err) {
        return {
          llmContent: `Error: Directory does not exist: ${targetDir}`,
          returnDisplay: `Error: Directory does not exist: ${targetDir}`,
          error: {
            message: `Directory does not exist: ${targetDir}`,
            type: ToolErrorType.FD_EXECUTION_ERROR,
          },
        };
      }

      // Check if within workspace
      const workspaceDirs = this.config.getWorkspaceContext().getDirectories();
      const isWithinWorkspace = workspaceDirs.some((wsDir) =>
        targetDir.startsWith(wsDir),
      );

      if (!isWithinWorkspace) {
        return {
          llmContent: `Error: Directory is not within workspace: ${targetDir}`,
          returnDisplay: `Error: Directory is not within workspace: ${targetDir}`,
          error: {
            message: `Directory is not within workspace: ${targetDir}`,
            type: ToolErrorType.FD_EXECUTION_ERROR,
          },
        };
      }

      // Execute fd command
      const { stdout, stderr, exitCode } = await execa('fd', args, {
        cwd: targetDir,
        reject: false, // Don't throw on non-zero exit codes
        signal,
      });

      // Handle quiet flag separately - if quiet is true, only return success/failure
      if (this.params.quiet) {
        const isSuccess = exitCode === 0;
        const llmContent = isSuccess
          ? 'fd command executed successfully (quiet mode)'
          : 'fd command executed but had matches (quiet mode)';

        return {
          llmContent,
          returnDisplay: llmContent,
        };
      }

      // Build result
      let llmContent = '';
      if (stderr) {
        llmContent = `fd command error:\n${stderr}\n`;
      }
      if (stdout) {
        llmContent += `fd command output:\n${stdout}`;
      } else if (!stderr) {
        llmContent += 'fd command executed successfully (no output)';
      }

      let returnDisplay = '';
      if (stdout) {
        returnDisplay = stdout;
      } else if (stderr) {
        returnDisplay = stderr;
      } else if (exitCode !== 0) {
        returnDisplay = `Command exited with code: ${exitCode}`;
      }

      if (this.params.show_errors && stderr) {
        returnDisplay = `Errors:\n${stderr}\n\nOutput:\n${returnDisplay}`;
      }

      return {
        llmContent,
        returnDisplay,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      return {
        llmContent: `Error executing fd command: ${errorMessage}`,
        returnDisplay: `Error: ${errorMessage}`,
        error: {
          message: errorMessage,
          type: ToolErrorType.FD_EXECUTION_ERROR,
        },
      };
    }
  }
}

function getFdToolDescription(): string {
  return `A program to find entries in your filesystem.

Usage: fd [OPTIONS] [pattern] [path]...

Arguments:
  [pattern]
          the search pattern which is either a regular expression (default)
          or a glob pattern (if --glob is used). If no pattern has been
          specified, every entry is considered a match. If your pattern
          starts with a dash (-), make sure to pass '--' first, or it will
          be considered as a flag (fd -- '-foo').

  [path]...
          The directory where the filesystem search is rooted (optional). If
          omitted, search the current working directory.

Options:
  -H, --hidden
          Include hidden directories and files in the search results
          (default: hidden files and directories are skipped). Files and
          directories are considered to be hidden if their name starts with
          a \`.\` sign (dot). Any files or directories that are ignored due to
          the rules described by --no-ignore are still ignored unless
          otherwise specified. The flag can be overridden with --no-hidden.

  -I, --no-ignore
          Show search results from files and directories that would
          otherwise be ignored by '.gitignore', '.ignore', '.fdignore', or
          the global ignore file, The flag can be overridden with --ignore.

      --no-ignore-vcs
          Show search results from files and directories that would
          otherwise be ignored by '.gitignore' files. The flag can be
          overridden with --ignore-vcs.

      --no-require-git
          Do not require a git repository to respect gitignores. By default,
          fd will only respect global gitignore rules, .gitignore rules, and
          local exclude rules if fd detects that you are searching inside a
          git repository. This flag allows you to relax this restriction
          such that fd will respect all git related ignore rules regardless
          of whether you're searching in a git repository or not.

          This flag can be disabled with --require-git.

      --no-ignore-parent
          Show search results from files and directories that would
          otherwise be ignored by '.gitignore', '.ignore', or '.fdignore'
          files in parent directories.

  -u, --unrestricted...
          Perform an unrestricted search, including ignored and hidden
          files. This is an alias for '--no-ignore --hidden'.

  -s, --case-sensitive
          Perform a case-sensitive search. By default, fd uses
          case-insensitive searches, unless the pattern contains an
          uppercase character (smart case).

  -i, --ignore-case
          Perform a case-insensitive search. By default, fd uses
          case-insensitive searches, unless the pattern contains an
          uppercase character (smart case).

  -g, --glob
          Perform a glob-based search instead of a regular expression
          search.

      --regex
          Perform a regular-expression based search (default). This can be
          used to override --glob.

  -F, --fixed-strings
          Treat the pattern as a literal string instead of a regular
          expression. Note that this also performs substring comparison. If
          you want to match on an exact filename, consider using '--glob'.

      --and <pattern>
          Add additional required search patterns, all of which must be
          matched. Multiple additional patterns can be specified. The
          patterns are regular expressions, unless '--glob' or
          '--fixed-strings' is used.

  -a, --absolute-path
          Shows the full path starting from the root as opposed to relative
          paths. The flag can be overridden with --relative-path.

  -l, --list-details
          Use a detailed listing format like 'ls -l'. This is basically an
          alias for '--exec-batch ls -l' with some additional 'ls' options.
          This can be used to see more metadata, to show symlink targets and
          to achieve a deterministic sort order.

  -L, --follow
          By default, fd does not descend into symlinked directories. Using
          this flag, symbolic links are also traversed. Flag can be
          overridden with --no-follow.

  -p, --full-path
          By default, the search pattern is only matched against the
          filename (or directory name). Using this flag, the pattern is
          matched against the full (absolute) path. Example:
            fd --glob -p '**/.git/config'

  -0, --print0
          Separate search results by the null character (instead of
          newlines). Useful for piping results to 'xargs'.

  -d, --max-depth <depth>
          Limit the directory traversal to a given depth. By default, there
          is no limit on the search depth.

      --min-depth <depth>
          Only show search results starting at the given depth. See also:
          '--max-depth' and '--exact-depth'

      --exact-depth <depth>
          Only show search results at the exact given depth. This is an
          alias for '--min-depth <depth> --max-depth <depth>'.

  -E, --exclude <pattern>
          Exclude files/directories that match the given glob pattern. This
          overrides any other ignore logic. Multiple exclude patterns can be
          specified.

          Examples:
            --exclude '*.pyc'
            --exclude node_modules

      --prune
          Do not traverse into directories that match the search criteria.
          If you want to exclude specific directories, use the '--exclude=…'
          option.

  -t, --type <filetype>
          Filter the search by type:
            'f' or 'file':         regular files
            'd' or 'dir' or 'directory':    directories
            'l' or 'symlink':      symbolic links
            's' or 'socket':       socket
            'p' or 'pipe':         named pipe (FIFO)
            'b' or 'block-device': block device
            'c' or 'char-device':  character device

            'x' or 'executable':   executables
            'e' or 'empty':        empty files or directories

          This option can be specified more than once to include multiple
          file types. Searching for '--type file --type symlink' will show
          both regular files as well as symlinks. Note that the 'executable'
          and 'empty' filters work differently: '--type executable' implies
          '--type file' by default. And '--type empty' searches for empty
          files and directories, unless either '--type file' or '--type
          directory' is specified in addition.

          Examples:
            - Only search for files:
                fd --type file …
                fd -tf …
            - Find both files and symlinks
                fd --type file --type symlink …
                fd -tf -tl …
            - Find executable files:
                fd --type executable
                fd -tx
            - Find empty files:
                fd --type empty --type file
                fd -te -tf
            - Find empty directories:
                fd --type empty --type directory
                fd -te -td

  -e, --extension <ext>
          (Additionally) filter search results by their file extension.
          Multiple allowable file extensions can be specified.

          If you want to search for files without extension, you can use the
          regex '^[^.]+$' as a normal search pattern.

  -S, --size <size>
          Limit results based on the size of files using the format
          <+-><NUM><UNIT>.
             '+': file size must be greater than or equal to this
             '-': file size must be less than or equal to this

          If neither '+' nor '-' is specified, file size must be exactly
          equal to this.
             'NUM':  The numeric size (e.g. 500)
             'UNIT': The units for NUM. They are not case-sensitive.
          Allowed unit values:
              'b':  bytes
              'k':  kilobytes (base ten, 10^3 = 1000 bytes)
              'm':  megabytes
              'g':  gigabytes
              't':  terabytes
              'ki': kibibytes (base two, 2^10 = 1024 bytes)
              'mi': mebibytes
              'gi': gibibytes
              'ti': tebibytes

      --changed-within <date|dur>
          Filter results based on the file modification time. Files with
          modification times greater than the argument are returned. The
          argument can be provided as a specific point in time (YYYY-MM-DD
          HH:MM:SS or @../qwen/qwen-code/---) or as a duration (10h, 1d, 35min). If the
          time is not specified, it defaults to 00:00:00.
          '--change-newer-than', '--newer', or '--changed-after' can be used
          as aliases.

          Examples:
              --changed-within 2weeks
              --change-newer-than '2018-10-27 10:00:00'
              --newer 2018-10-27
              --changed-after 1day

      --changed-before <date|dur>
          Filter results based on the file modification time. Files with
          modification times less than the argument are returned. The
          argument can be provided as a specific point in time (YYYY-MM-DD
          HH:MM:SS or @../qwen/qwen-code/---) or as a duration (10h, 1d, 35min).
          '--change-older-than' or '--older' can be used as aliases.

          Examples:
              --changed-before '2018-10-27 10:00:00'
              --change-older-than 2weeks
              --older 2018-10-27

  -o, --owner <user:group>
          Filter files by their user and/or group. Format:
          [(user|uid)][:(group|gid)]. Either side is optional. Precede
          either side with a '!' to exclude files instead.

          Examples:
              --owner john
              --owner :students
              --owner '!john:students'

      --format <fmt>
          Print results according to template

  -x, --exec <cmd>...
          Execute a command for each search result in parallel (use
          --threads=1 for sequential command execution). There is no
          guarantee of the order commands are executed in, and the order
          should not be depended upon. All positional arguments following
          --exec are considered to be arguments to the command - not to fd.
          It is therefore recommended to place the '-x'/'--exec' option
          last.
          The following placeholders are substituted before the command is
          executed:
            '{}':   path (of the current search result)
            '{/}':  basename
            '{//}': parent directory
            '{.}':  path without file extension
            '{/.}': basename without file extension
            '{{':   literal '{' (for escaping)
            '}}':   literal '}' (for escaping)

          If no placeholder is present, an implicit "{}" at the end is
          assumed.

          Examples:

            - find all *.zip files and unzip them:

                fd -e zip -x unzip

            - find *.h and *.cpp files and run "clang-format -i .." for each
            of them:

                fd -e h -e cpp -x clang-format -i

            - Convert all *.jpg files to *.png files:

                fd -e jpg -x convert {} {.}.png

  -X, --exec-batch <cmd>...
          Execute the given command once, with all search results as
          arguments.
          The order of the arguments is non-deterministic, and should not be
          relied upon.
          One of the following placeholders is substituted before the
          command is executed:
            '{}':   path (of all search results)
            '{/}':  basename
            '{//}': parent directory
            '{.}':  path without file extension
            '{/.}': basename without file extension
            '{{':   literal '{' (for escaping)
            '}}':   literal '}' (for escaping)

          If no placeholder is present, an implicit "{}" at the end is
          assumed.

          Examples:

            - Find all test_*.py files and open them in your favorite
            editor:

                fd -g 'test_*.py' -X vim

            - Find all *.rs files and count the lines with "wc -l ...":

                fd -e rs -X wc -l

      --batch-size <size>
          Maximum number of arguments to pass to the command given with -X.
          If the number of results is greater than the given size, the
          command given with -X is run again with remaining arguments. A
          batch size of zero means there is no limit (default), but note
          that batching might still happen due to OS restrictions on the
          maximum length of command lines.

          [default: 0]

      --ignore-file <path>
          Add a custom ignore-file in '.gitignore' format. These files have
          a low precedence.

  -c, --color <when>
          Declare when to use color for the pattern match output

          [default: auto]

          Possible values:
          - auto:   show colors if the output goes to an interactive console
            (default)
          - always: always use colorized output
          - never:  do not use colorized output

      --hyperlink[=<when>]
          Add a terminal hyperlink to a file:// url for each path in the
          output.

          Auto mode  is used if no argument is given to this option.

          This doesn't do anything for --exec and --exec-batch.

          [default: never]

          Possible values:
          - auto:   Use hyperlinks only if color is enabled
          - always: Always use hyperlinks when printing file paths
          - never:  Never use hyperlinks

  -j, --threads <num>
          Set number of threads to use for searching & executing (default:
          number of available CPU cores)

      --max-results <count>
          Limit the number of search results to 'count' and quit
          immediately.

  -1
          Limit the search to a single result and quit immediately. This is
          an alias for '--max-results=1'.

  -q, --quiet
          When the flag is present, the program does not print anything and
          will return with an exit code of 0 if there is at least one match.
          Otherwise, the exit code will be 1. '--has-results' can be used as
          an alias.

      --show-errors
          Enable the display of filesystem errors for situations such as
          insufficient permissions or dead symlinks.

      --base-directory <path>
          Change the current working directory of fd to the provided path.
          This means that search results will be shown with respect to the
          given base path. Note that relative paths which are passed to fd
          via the positional <path> argument or the '--search-path' option
          will also be resolved relative to this directory.

      --path-separator <separator>
          Set the path separator to use when printing file paths. The
          default is the OS-specific separator ('/' on Unix).

      --search-path <search-path>
          Provide paths to search as an alternative to the positional <path>
          argument. Changes the usage to \`fd [OPTIONS] --search-path <path>
          --search-path <path2> [<pattern>]\`

      --strip-cwd-prefix[=<when>]
          By default, relative paths are prefixed with './' when -x/--exec,
          -X/--exec-batch, or -0/--print0 are given, to reduce the risk of a
          path starting with '-' being treated as a command line option. Use
          this flag to change this behavior. If this flag is used without a
          value, it is equivalent to passing "always".

          Possible values:
          - auto:   Use the default behavior
          - always: Always strip the ./ at the beginning of paths
          - never:  Never strip the ./

      --one-file-system
          By default, fd will traverse the file system tree as far as other
          options dictate. With this flag, fd ensures that it does not
          descend into a different file system than the one it started in.
          Comparable to the -mount or -xdev filters of find(1).

  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version`;
}

export class FdTool extends BaseDeclarativeTool<FdToolParams, ToolResult> {
  static Name: string = ToolNames.FD;

  constructor(private readonly config: Config) {
    super(
      FdTool.Name,
      ToolDisplayNames.FD,
      getFdToolDescription(),
      Kind.Search,
      {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description:
              'The search pattern which is either a regular expression (default) or a glob pattern (if --glob is used). If no pattern has been specified, every entry is considered a match.',
          },
          path: {
            type: 'string',
            description:
              'The directory where the filesystem search is rooted (optional). If omitted, search the current working directory.',
          },
          hidden: {
            type: 'boolean',
            description:
              'Include hidden directories and files in the search results (default: hidden files and directories are skipped).',
          },
          no_ignore: {
            type: 'boolean',
            description:
              "Show search results from files and directories that would otherwise be ignored by '.gitignore', '.ignore', '.fdignore', or the global ignore file.",
          },
          no_ignore_vcs: {
            type: 'boolean',
            description:
              "Show search results from files and directories that would otherwise be ignored by '.gitignore' files.",
          },
          no_require_git: {
            type: 'boolean',
            description:
              'Do not require a git repository to respect gitignores.',
          },
          no_ignore_parent: {
            type: 'boolean',
            description:
              'Show search results from files and directories that would be ignored by ignore files in parent directories.',
          },
          unrestricted: {
            type: 'boolean',
            description:
              "Perform an unrestricted search, including ignored and hidden files. This is an alias for '--no-ignore --hidden'.",
          },
          case_sensitive: {
            type: 'boolean',
            description: 'Perform a case-sensitive search.',
          },
          ignore_case: {
            type: 'boolean',
            description: 'Perform a case-insensitive search.',
          },
          glob: {
            type: 'boolean',
            description:
              'Perform a glob-based search instead of a regular expression search.',
          },
          regex: {
            type: 'boolean',
            description: 'Perform a regular-expression based search (default).',
          },
          fixed_strings: {
            type: 'boolean',
            description:
              'Treat the pattern as a literal string instead of a regular expression.',
          },
          and: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Add additional required search patterns, all of which must be matched.',
          },
          absolute_path: {
            type: 'boolean',
            description:
              'Shows the full path starting from the root as opposed to relative paths.',
          },
          list_details: {
            type: 'boolean',
            description: "Use a detailed listing format like 'ls -l'.",
          },
          follow: {
            type: 'boolean',
            description:
              'By default, fd does not descend into symlinked directories. Using this flag, symbolic links are also traversed.',
          },
          full_path: {
            type: 'boolean',
            description:
              'By default, the search pattern is only matched against the filename (or directory name). Using this flag, the pattern is matched against the full (absolute) path.',
          },
          print0: {
            type: 'boolean',
            description:
              'Separate search results by the null character (instead of newlines).',
          },
          max_depth: {
            type: 'number',
            description: 'Limit the directory traversal to a given depth.',
          },
          min_depth: {
            type: 'number',
            description:
              'Only show search results starting at the given depth.',
          },
          exact_depth: {
            type: 'number',
            description: 'Only show search results at the exact given depth.',
          },
          exclude: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Exclude files/directories that match the given glob pattern.',
          },
          prune: {
            type: 'boolean',
            description:
              'Do not traverse into directories that match the search criteria.',
          },
          type: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'f',
                'file',
                'd',
                'dir',
                'directory',
                'l',
                'symlink',
                's',
                'socket',
                'p',
                'pipe',
                'b',
                'block-device',
                'c',
                'char-device',
                'x',
                'executable',
                'e',
                'empty',
              ],
            },
            description:
              'Filter the search by type (f/file=regular files, d/dir/directory=directories, l=symlink, etc.)',
          },
          extension: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter search results by their file extension.',
          },
          size: {
            type: 'string',
            description:
              'Limit results based on the size of files using the format <+-><NUM><UNIT>.',
          },
          changed_within: {
            type: 'string',
            description:
              'Filter results based on the file modification time - files with modification times greater than the argument are returned.',
          },
          changed_before: {
            type: 'string',
            description:
              'Filter results based on the file modification time - files with modification times less than the argument are returned.',
          },
          owner: {
            type: 'string',
            description:
              'Filter files by their user and/or group. Format: [(user|uid)][:(group|gid)]',
          },
          exec: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Execute a command for each search result in parallel.',
          },
          exec_batch: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Execute the given command once, with all search results as arguments.',
          },
          batch_size: {
            type: 'number',
            description:
              'Maximum number of arguments to pass to the command given with -X.',
          },
          ignore_file: {
            type: 'string',
            description: "Add a custom ignore-file in '.gitignore' format.",
          },
          color: {
            type: 'string',
            enum: ['auto', 'always', 'never'],
            description:
              'Declare when to use color for the pattern match output.',
          },
          hyperlink: {
            type: 'string',
            enum: ['auto', 'always', 'never'],
            description:
              'Add a terminal hyperlink to a file:// url for each path in the output.',
          },
          threads: {
            type: 'number',
            description:
              'Set number of threads to use for searching & executing (default: number of available CPU cores).',
          },
          max_results: {
            type: 'number',
            description:
              'Limit the number of search results to count and quit immediately.',
          },
          quiet: {
            type: 'boolean',
            description:
              'When the flag is present, the program does not print anything and will return with an exit code of 0 if there is at least one match.',
          },
          show_errors: {
            type: 'boolean',
            description:
              'Enable the display of filesystem errors for situations such as insufficient permissions or dead symlinks.',
          },
          base_directory: {
            type: 'string',
            description:
              'Change the current working directory of fd to the provided path.',
          },
          path_separator: {
            type: 'string',
            description:
              'Set the path separator to use when printing file paths.',
          },
          search_path: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Provide paths to search as an alternative to the positional <path> argument.',
          },
          strip_cwd_prefix: {
            type: 'string',
            enum: ['auto', 'always', 'never'],
            description:
              'Control whether relative paths are prefixed with ./ when using -x/-X/-0 options.',
          },
          one_file_system: {
            type: 'boolean',
            description:
              'Ensure that fd does not descend into a different file system than the one it started in.',
          },
        },
      } as Record<string, unknown>,
      false, // not markdown
      false, // can't update output (doesn't stream)
    );
  }

  protected override validateToolParamValues(
    params: FdToolParams,
  ): string | null {
    // Validate paths
    if (params.path) {
      let targetDir = params.path;
      if (!path.isAbsolute(params.path)) {
        // If it's a relative path, join with target directory
        targetDir = path.join(this.config.getTargetDir(), params.path);
      }

      try {
        const stats = fs.statSync(targetDir);
        if (!stats.isDirectory()) {
          return `Path exists but is not a directory: ${params.path}`;
        }
      } catch (err) {
        return `Directory does not exist: ${params.path}`;
      }

      // Check if within workspace
      const workspaceDirs = this.config.getWorkspaceContext().getDirectories();
      const isWithinWorkspace = workspaceDirs.some((wsDir) =>
        targetDir.startsWith(wsDir),
      );

      if (!isWithinWorkspace) {
        return `Directory is not within workspace: ${params.path}`;
      }
    }

    // Validate base_directory if provided
    if (params.base_directory) {
      if (!path.isAbsolute(params.base_directory)) {
        return 'Base directory must be an absolute path';
      }

      try {
        const stats = fs.statSync(params.base_directory);
        if (!stats.isDirectory()) {
          return `Base directory exists but is not a directory: ${params.base_directory}`;
        }
      } catch (err) {
        return `Base directory does not exist: ${params.base_directory}`;
      }

      // Check if within workspace
      const workspaceDirs = this.config.getWorkspaceContext().getDirectories();
      const isWithinWorkspace = workspaceDirs.some((wsDir) =>
        params.base_directory!.startsWith(wsDir),
      );

      if (!isWithinWorkspace) {
        return `Base directory is not within workspace: ${params.base_directory}`;
      }
    }

    // Validate search_path if provided
    if (params.search_path) {
      for (const searchPath of params.search_path) {
        let fullPath = searchPath;
        if (!path.isAbsolute(searchPath)) {
          fullPath = path.join(this.config.getTargetDir(), searchPath);
        }

        try {
          const stats = fs.statSync(fullPath);
          if (!stats.isDirectory()) {
            return `Search path exists but is not a directory: ${searchPath}`;
          }
        } catch (err) {
          return `Search path does not exist: ${searchPath}`;
        }

        // Check if within workspace
        const workspaceDirs = this.config
          .getWorkspaceContext()
          .getDirectories();
        const isWithinWorkspace = workspaceDirs.some((wsDir) =>
          fullPath.startsWith(wsDir),
        );

        if (!isWithinWorkspace) {
          return `Search path is not within workspace: ${searchPath}`;
        }
      }
    }

    // Validate ignore_file if provided
    if (params.ignore_file) {
      if (!path.isAbsolute(params.ignore_file)) {
        // Check if it's a relative path within workspace
        const fullPath = path.join(
          this.config.getTargetDir(),
          params.ignore_file,
        );

        try {
          const stats = fs.statSync(fullPath);
          if (!stats.isFile()) {
            return `Ignore file exists but is not a file: ${params.ignore_file}`;
          }
        } catch (err) {
          return `Ignore file does not exist: ${params.ignore_file}`;
        }
      }
    }

    return null;
  }

  protected createInvocation(
    params: FdToolParams,
  ): ToolInvocation<FdToolParams, ToolResult> {
    return new FdToolInvocation(this.config, params);
  }
}
