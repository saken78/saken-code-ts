# Qwen Code - Product Requirements Document

## Overview

Qwen Code is an interactive CLI agent that helps developers build better software faster through context-aware prompting and intelligent prompt injection.

## Problem Statement

Developers using LLM-powered tools struggle with:

1. **Generic responses** - LLM doesn't understand project-specific context
2. **Forgotten decisions** - Architectural decisions get lost between sessions
3. **Hallucinated requirements** - LLM makes up details that contradict project docs
4. **No quality gates** - No objective definition of "done"
5. **Context loss** - Long conversations become unfocused

## Solution: BMAD-Inspired Workflow

Implement a documentation-aware workflow where:

- Project docs are the **single source of truth**
- LLM always has access to **recent decisions**
- Every interaction includes **relevant context**
- Quality standards are **explicit and enforced**
- Knowledge is **preserved across sessions**

## Core Features

### Feature 1: Context-Aware Prompts (DONE)

**What:** Specialized prompts for different work modes
**Why:** Reduces hallucination, focuses LLM on the right task
**How:** /coding, /debug, /review, /design commands

- Coding: Fast implementation, minimal code
- Debug: Root cause analysis, data-driven
- Review: Security & quality checks
- Design: Architecture planning, trade-offs

### Feature 2: Document-Aware Interactions (TODO)

**What:** Auto-load project documentation during interactions
**Why:** Eliminates hallucination about "what was decided"
**How:** /docs, /vision, /product, /progress commands

- /docs - load documentation context automatically
- /vision - remind of project vision & boundaries
- /product - load product requirements from PRD
- /progress - show implementation progress from logs

### Feature 3: Memory-Injected Context (TODO)

**What:** Auto-inject previous decisions into every conversation
**Why:** Consistent decisions across sessions, prevent repeated mistakes
**How:** Auto-loaded from decisions-log.md and bug-log.md

- Recent architectural decisions (last 10)
- Known bugs and fixes (last 20)
- Performance constraints (all active)
- Security considerations (all active)

### Feature 4: Definition-of-Done (TODO)

**What:** Objective quality checklist before marking work complete
**Why:** Prevents shipping incomplete work, aligns team on standards
**How:** /done command validates against checklist

- Tests passing (80%+ coverage)
- Types checking
- Code reviewed
- Decisions documented
- Related features tested
- Performance validated

### Feature 5: Conversation Compression (TODO)

**What:** Auto-summarize long conversations back into docs
**Why:** No context loss between sessions, natural knowledge capture
**How:** /compress command generates summaries

- Implementation log (what was done)
- Decisions log (why it was done)
- Bug log (what went wrong)
- Insights (lessons learned)

## User Stories

### Story 1: Developer starts implementing a feature

```
User: /docs
→ System loads feature-spec.md + tech-design.md
→ User has full context before starting

User: /coding implement user authentication
→ Injected with coding-mode prompt
→ Focuses on implementation, follows patterns
```

### Story 2: Developer gets stuck on a bug

```
User: /debug getting timeout in payment module
→ System loads recent bugs from bug-log.md
→ Injects debug-mode prompt with data-driven guidance
→ References similar bugs that were fixed

Result: Root cause identified, fix validated
```

### Story 3: Developer needs code review

```
User: /review @src/auth.ts for security
→ System loads security constraints from tech-design.md
→ Injects review-mode prompt with security focus
→ References past security issues from bug-log.md

Result: Issues found with specific fixes
```

### Story 4: Developer marks work as done

```
User: /done
→ System checks definition-of-done.md
→ Validates tests, types, documentation
→ Provides checklist of remaining items

Result: Work validated before shipping
```

### Story 5: Developer starts new session

```
New session starts
→ System loads implementation-log.md (what was done)
→ System loads decisions-log.md (why it was done)
→ System loads active feature spec
→ Developer has full context immediately

Result: Zero context loss between sessions
```

## Success Metrics

- [ ] Hallucination rate reduced by 50%+ (measured by decision consistency)
- [ ] Average session length increased (users can focus longer)
- [ ] Quality issues detected before review (via /done)
- [ ] New team members onboard 2x faster (via docs)
- [ ] Zero "forgot we decided that" moments

## Out of Scope

- IDE integration (separate project)
- Multi-LLM support (phase 2)
- Real-time collaboration (future)
- Visual documentation UI (future)
- Automatic doc generation (future, if needed)

## Dependencies

- Git (for phase detection)
- TypeScript (for type-checking in /done)
- npm/yarn (for test running in /done)
- Qwen API (for LLM interactions)

## Timeline

- Phase 1 (Week 1): Document structure + loader service
- Phase 2 (Week 2): All commands + injection services
- Phase 3 (Week 3): Testing + refinement
- Phase 4 (Week 4): Release + documentation
