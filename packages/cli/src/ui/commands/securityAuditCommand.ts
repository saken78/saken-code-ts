/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand } from './types.js';
import { CommandKind } from './types.js';
import { t } from '../../i18n/index.js';

export const securityAuditCommand: SlashCommand = {
  name: 'security-audit',
  get description() {
    return t('Find security vulnerabilities');
  },
  kind: CommandKind.BUILT_IN,
  action: (_context, args) => {
    const argsList = args ? args.trim().split(/\s+/) : [];

    if (argsList.length === 0) {
      return {
        type: 'message',
        messageType: 'info',
        content: `Security Audit Skill
====================

Scans code and configuration for security vulnerabilities.

Usage: /security-audit <target>

Targets:
  code          - Scan code for vulnerabilities
  config        - Check configuration security
  secrets       - Find exposed secrets
  dependencies  - Check for vulnerable deps
  all           - Full security audit

Examples:
  /security-audit code
  Review this code for security issues

  /security-audit config
  Check Docker config for security

  /security-audit secrets
  Are any secrets exposed here?

  /security-audit dependencies
  Any vulnerable packages?

What This Checks:
  ✓ Hardcoded passwords/keys
  ✓ SQL injection risks
  ✓ XSS vulnerabilities
  ✓ CSRF protection
  ✓ Authentication/Authorization
  ✓ Data encryption
  ✓ Known CVEs
  ✓ Best practices

Why Use This:
  • Find actual vulnerabilities, not guesses
  • Check before deployment
  • OWASP Top 10 coverage
  • Get actionable recommendations`,
      };
    }

    const target = argsList[0].toLowerCase();

    return {
      type: 'message',
      messageType: 'info',
      content: `Security Audit: ${target}
${'='.repeat(40)}

Running security audit on ${target}...

Please paste the ${target === 'code' ? 'code snippet' : 'configuration'} to audit.

I will check for:
✓ Vulnerabilities
✓ Security best practices
✓ Hardcoded secrets
✓ Configuration issues
✓ Known CVEs
✓ OWASP violations

Results will include:
• Severity levels (Critical/High/Medium/Low)
• Exact locations
• Risk explanation
• Recommended fixes`,
    };
  },
};
