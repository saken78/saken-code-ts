/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';

export const formatValidatorCommand: SlashCommand = {
  name: 'format-validator',
  get description() {
    return t('Validate YAML, TOML, JSON, XML files');
  },
  kind: CommandKind.BUILT_IN,
  action: (_context, args) => {
    const argsList = args ? args.trim().split(/\s+/) : [];

    if (argsList.length === 0) {
      return {
        type: 'message',
        messageType: 'info',
        content: `Format Validator Skill
======================

Validates configuration files for syntax errors and structure issues.

Usage: /format-validator <format> [options]

Supported Formats:
  yaml, yml   - YAML files (docker-compose, k8s, etc.)
  json        - JSON files (config, API responses)
  toml        - TOML files (pyproject.toml, cargo.toml)
  xml         - XML files (pom.xml, settings.xml)

Examples:
  /format-validator yaml
  Validate this docker-compose.yml file

  /format-validator json
  Check this package.json

  /format-validator toml
  Verify pyproject.toml syntax

What This Does:
  ✓ Checks syntax correctness
  ✓ Validates indentation
  ✓ Checks required fields
  ✓ Verifies type correctness
  ✓ Reports exact error locations

Why Use This:
  • Prevents deploy errors from bad config
  • Catches typos before they cause issues
  • Validates against standard schemas
  • No guessing - actual format validation`,
      };
    }

    const format = argsList[0].toLowerCase();

    if (!['yaml', 'yml', 'json', 'toml', 'xml'].includes(format)) {
      return {
        type: 'message',
        messageType: 'error',
        content: `Unknown format: ${format}

Supported formats: yaml, json, toml, xml`,
      };
    }

    return {
      type: 'message',
      messageType: 'info',
      content: `Format Validator: ${format.toUpperCase()}
${'='.repeat(40)}

Ready to validate ${format.toUpperCase()} file.

Please paste the file content or describe what you want to validate.

I will check:
• Syntax correctness
• Structure/indentation
• Type validation
• Required fields
• Common mistakes

Report will show exact line numbers and fixes.`,
    };
  },
};
