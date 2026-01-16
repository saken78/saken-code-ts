# Architectural Decisions Log

## Decision: Use PR #1436 Pattern for Slash Commands

**Date:** 2026-01-16
**Context:** Implementing context-aware slash commands
**Decision:** Follow PR #1436 pattern exactly for /coding, /debug, /review, /design commands
**Rationale:**

- PR #1436 demonstrates working pattern with skillsCommand.ts
- Pattern is consistent with codebase conventions
- Includes proper completion suggestions and context injection
  **Status:** ✅ IMPLEMENTED
  **Related:** /coding, /debug, /review, /design commands

## Decision: Separate Individual Command Files (Not Group)

**Date:** 2026-01-16
**Context:** User requested separated commands instead of grouping
**Decision:** Create individual command files:

- codingCommand.ts
- debugCommand.ts
- reviewCommand.ts
- designCommand.ts
  **Rationale:**
- Better for code organization (each command focused)
- Easier to modify individual commands without touching others
- Matches existing pattern in codebase (each command in own file)
  **Status:** ✅ IMPLEMENTED

## Decision: BMAD Document Structure in .docs/

**Date:** 2026-01-16
**Context:** Need to implement document-aware prompts
**Decision:** Create .docs/ folder with BMAD-inspired structure:

- 00-context/ (vision, assumptions, system-state)
- 01-product/ (prd)
- 02-features/ (feature-\*/feature-spec, tech-design, dev-tasks)
- 03-logs/ (implementation-log, decisions-log, bug-log, insights)
- 04-process/ (dev-workflow, definition-of-done, canonical-prompts)
  **Rationale:**
- Matches BMAD methodology structure
- Provides single source of truth for project knowledge
- Enables "document-aware" prompt injection (no hallucination)
- Supports team onboarding through documentation
  **Status:** ✅ CREATED
  **Next:** Create DocumentLoaderService to read these docs

## Decision: Implement in Order of Dependencies

**Date:** 2026-01-16
**Context:** 5 ideas proposed, need to prioritize
**Decision:** Implement in logical order:

1. Document-Aware Prompts (foundation, needed by all)
2. Memory Injection (depends on doc structure)
3. Phase Detection (can use doc structure)
4. Definition-of-Done (validates doc updates)
5. Compression (uses all above)
   **Rationale:**

- Each phase depends on previous
- Early phases unblock later ones
- Foundation first approach reduces rework
  **Status:** ⏳ IN PROGRESS

## Decision: System-Level Injection for Decisions/Bugs

**Date:** 2026-01-16
**Context:** Where to inject loaded decisions and bugs
**Decision:** Inject at system prompt level (not message level)
**Rationale:**

- Ensures context persists across entire conversation
- Higher priority than message-level injection
- Matches existing PromptInjectionService pattern
- Prevents hallucination about "what was decided"
  **Status:** ⏳ PLANNED

## Open Questions / To Be Decided

1. Should /docs auto-load on session start or only on explicit command?
   - Current thinking: Explicit command (less intrusive)
2. How much doc context to inject (full vs summarized)?
   - Current thinking: Full for decisions/bugs, summarized for large docs
3. Should missing docs block workflow or just warn?
   - Current thinking: Warn but continue (graceful degradation)
