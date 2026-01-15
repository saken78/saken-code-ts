/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';

export const errorParserCommand: SlashCommand = {
  name: 'error-parser',
  get description() {
    return t('Parse error messages and stack traces');
  },
  kind: CommandKind.BUILT_IN,
  action: (_context, args) => {
    const argsList = args ? args.trim().split(/\s+/) : [];

    if (argsList.length === 0) {
      return {
        type: 'message',
        messageType: 'info',
        content: `Error Parser Skill
==================

Parses error messages and stack traces to extract root causes.

Usage: /error-parser <error-type>

Error Types:
  typescript  - TypeScript compilation errors
  javascript  - JavaScript runtime errors
  stack-trace - Stack trace parsing
  http        - HTTP error responses
  database    - Database errors
  generic     - Generic error analysis

Examples:
  /error-parser typescript
  Parse this TypeScript error

  /error-parser stack-trace
  Analyze this stack trace

  /error-parser http
  Explain this HTTP 404 error

  /error-parser database
  What's wrong with this DB error?

What This Does:
  ✓ Identifies error type
  ✓ Extracts location info
  ✓ Shows code context
  ✓ Explains root cause
  ✓ Suggests fixes

Why Use This:
  • Stop guessing what errors mean
  • Get exact error location
  • Understand error chains
  • Find root cause systematically`,
      };
    }

    const errorType = argsList[0].toLowerCase();

    return {
      type: 'message',
      messageType: 'info',
      content: `Error Parser: ${errorType}
${'='.repeat(40)}

Ready to parse ${errorType} errors.

Please paste the error message or stack trace.

I will identify:
✓ Error type and category
✓ Exact location (file:line:column)
✓ Root cause
✓ Related errors
✓ Suggested fixes`,
    };
  },
};
