/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Document-Aware Prompts for BMAD integration
 * Injected into conversations to make LLM aware of loaded documentation
 */

export const DOCUMENT_CONTEXT_SYSTEM_PROMPT = `
# Documentation-Aware Mode

You now have access to the project's documentation. When answering questions or making decisions:

1. **Check the docs first** - If something is documented, reference it
2. **Reference decisions** - When making choices, note if decisions-log.md covers this
3. **Avoid hallucination** - If unsure about a decision, ask or reference the docs
4. **Use actual requirements** - From prd.md, not guesses
5. **Remember past fixes** - Reference bug-log.md to avoid repeating mistakes

This is the project's source of truth. Always prefer documented decisions over speculation.
`;

/**
 * Get formatted context string for loaded documents
 */
export function getDocumentContextString(loadedContext: {
  vision?: string;
  product?: string;
  decisions?: string;
  bugs?: string;
  progress?: string;
}): string {
  const parts: string[] = [];

  if (loadedContext.vision) {
    parts.push(`## Project Vision & Scope\n${loadedContext.vision}`);
  }

  if (loadedContext.product) {
    parts.push(`## Product Requirements\n${loadedContext.product}`);
  }

  if (loadedContext.decisions) {
    parts.push(`## Recent Architectural Decisions\n${loadedContext.decisions}`);
  }

  if (loadedContext.bugs) {
    parts.push(`## Known Bugs & Fixes\n${loadedContext.bugs}`);
  }

  if (loadedContext.progress) {
    parts.push(`## Implementation Progress\n${loadedContext.progress}`);
  }

  return parts.join('\n\n---\n\n');
}

/**
 * Format document context for system injection
 */
export function formatDocumentContextForInjection(docs: {
  existingCount: number;
  totalCount: number;
  missingDocs: string[];
}): string {
  const status = `(${docs.existingCount}/${docs.totalCount} docs loaded)`;

  if (docs.missingDocs.length === 0) {
    return `\n✅ Full project documentation loaded ${status}. Reference it when making decisions.`;
  }

  const missing = docs.missingDocs.join(', ');
  return `\n⚠️  Partial documentation loaded ${status}. Missing: ${missing}. Use available docs when possible.`;
}

/**
 * Create context prompt for when documents are loaded
 */
export function getLoadedDocumentsPrompt(
  documentContext: string,
  userPrompt: string,
): string {
  return `[DOCUMENTATION-AWARE MODE]\n\n${DOCUMENT_CONTEXT_SYSTEM_PROMPT}\n\n---\n\n## Loaded Documentation\n${documentContext}\n\n---\n\n## Your Request\n${userPrompt}`;
}

/**
 * Memory injection prompt for decisions and bugs
 */
export const MEMORY_CONTEXT_PROMPT = `
# Decision & Bug Memory Injection

The following represents the project's collective memory of decisions and bugs. This context is injected automatically to prevent repeated mistakes and ensure architectural consistency.

When you see this, understand that:
- These decisions are binding (don't contradict them without discussion)
- These bugs are known and documented (reference them when relevant)
- These constraints are real (don't ignore them in new work)
`;

/**
 * Format memory context for injection
 */
export function getMemoryContextString(
  decisions?: string,
  bugs?: string,
): string {
  const parts: string[] = [MEMORY_CONTEXT_PROMPT];

  if (decisions) {
    parts.push(`## Architectural Decisions\n${decisions}`);
  }

  if (bugs) {
    parts.push(`## Known Bugs & Lessons Learned\n${bugs}`);
  }

  return parts.join('\n\n---\n\n');
}
