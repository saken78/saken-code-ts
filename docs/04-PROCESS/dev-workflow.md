# Development Workflow: Human + LLM Collaboration

**Status:** Active Workflow (Updated Jan 15, 2026)
**Focus:** Qwen Code personal development for 1000 GitHub contributions

---

## Overview

This workflow integrates:

- **Documentation** (00-context through 03-logs)
- **System Prompts** (claude-code-system-prompts)
- **Code** (prompts.ts and source)
- **Memory** (implementation logs, decisions, learnings)

The goal: Make progress visible, repeatable, and learnable.

---

## Daily Development Cycle

### Morning: Context & Planning (15 min)

1. **Review Context** (5 min)

   ```bash
   # Read the foundation
   cat docs/00-CONTEXT/{vision,assumptions,system-state}.md
   ```

2. **Check Progress** (5 min)

   ```bash
   # Review what changed yesterday
   git log --since="24 hours ago" --oneline

   # Check implementation log
   cat docs/03-LOGS/implementation-log.md | tail -50
   ```

3. **Select Today's Tasks** (5 min)
   ```bash
   # Look at dev-tasks.md in active features
   cat docs/02-FEATURES/feature-*/dev-tasks.md
   ```

### Midday: Implementation (4-6 hours)

1. **Start Work Session**

   ```bash
   # Create session note
   touch docs/03-LOGS/SESSION_$(date +%Y%m%d_%H%M%S).md

   # Update implementation log header
   echo "## $(date +%Y-%m-%d)" >> docs/03-LOGS/implementation-log.md
   ```

2. **Work on Task**
   - Follow feature spec in `02-FEATURES/feature-name/feature-spec.md`
   - Reference tech design for architecture
   - Update feature's implementation log as you go

3. **Commit Regularly** (every 30-45 min)

   ```bash
   # Atomic commits with clear messages
   git add .
   git commit -m "feat: specific change (#issue)

   - What changed
   - Why it changed
   - Any notes for future
   "
   ```

4. **Update Logs**

   ```bash
   # In docs/03-LOGS/implementation-log.md or SESSION file:
   - [x] Task 1 completed
   - [x] Discovery: [What you learned]
   - [x] Decision: [What you decided and why]

   # In docs/02-FEATURES/feature-name/feature-spec.md:
   - Update implementation log section
   - Mark completed tasks
   - Note blockers
   ```

### Evening: Review & Reflection (30 min)

1. **Push Changes**

   ```bash
   git push origin main
   ```

2. **Document Learnings**

   ```bash
   # Add to docs/03-LOGS/insights.md
   echo "
   ## Session [Date]

   **What Went Well:**
   - [Learning 1]
   - [Learning 2]

   **What to Improve:**
   - [Improvement 1]
   - [Improvement 2]

   **Next Session:**
   - [Task 1]
   - [Task 2]
   " >> docs/03-LOGS/insights.md
   ```

3. **Update Decisions Log** (if decision made)

   ```bash
   # In docs/03-LOGS/decisions-log.md
   echo "
   ### [Date] - Decision Title

   **Context:** [Why this decision was needed]
   **Options Considered:** [Alt 1, Alt 2, Alt 3]
   **Decision:** [What we chose and why]
   **Impact:** [What changes as a result]
   **Status:** [Implemented/Testing/At-Risk]
   " >> docs/03-LOGS/decisions-log.md
   ```

4. **Update System State** (if major change)
   ```bash
   # If you changed architecture/features, update:
   cat docs/00-CONTEXT/system-state.md
   # Add new features, update status, note changes
   ```

---

## Feature Development Workflow

### 1. Planning Phase

```
docs/00-CONTEXT/     ← Read vision & assumptions
         ↓
docs/01-PRODUCT/prd.md   ← Check requirements
         ↓
docs/02-FEATURES/feature-name/
  ├── feature-spec.md    ← Define acceptance criteria
  ├── tech-design.md     ← Architecture & design
  ├── dev-tasks.md       ← Breakdown into tasks
  ├── test-plan.md       ← Testing strategy
  └── implementation-log.md ← Track as you work
```

### 2. Implementation Phase

**Files to Reference:**

- `feature-spec.md` - What we're building
- `tech-design.md` - How to build it
- `packages/core/src/core/prompts.ts` - For prompt integration
- `claude-code-system-prompts/` - For system prompt examples

**Key Checkpoints:**

1. All unit tests pass
2. Integration tests pass
3. Manual testing complete
4. System prompts integrated (if needed)
5. Documentation updated

### 3. Validation Phase

Use `DEFINITION_OF_DONE.md`:

- [ ] Code quality checks
- [ ] Testing complete
- [ ] Documentation updated
- [ ] Performance acceptable
- [ ] Ready to commit

### 4. Commit & Document

```bash
# Create semantic commit
git commit -m "feat(feature-name): description

- Change 1
- Change 2

References: #issue, related to feature-xyz
"

# Update logs
echo "- [x] Feature complete: [description]" >> docs/03-LOGS/implementation-log.md
```

---

## System Prompts Integration Workflow

When implementing features that need LLM guidance:

### 1. Create System Prompt

Location: `packages/core/src/prompts/features/feature-name.ts`

```typescript
// Export prompt as constant
export const FEATURE_NAME_PROMPT = `
# Feature: [Name]

[Guidance for LLM]

## Key Instructions
- [Instruction 1]
- [Instruction 2]
`;
```

### 2. Reference Claude Code System Prompts

Check `/claude-code-system-prompts/system-prompts/` for patterns:

- `agent-prompt-*.md` - For subagent guidance
- `tool-description-*.md` - For tool integration
- `system-prompt-*.md` - For system behavior

### 3. Integrate into prompts.ts

In `packages/core/src/core/prompts.ts`:

```typescript
import { FEATURE_NAME_PROMPT } from '../prompts/features/feature-name.js';

export function getCoreSystemPrompt(
  userMemory?: string,
  model?: string,
): string {
  const basePrompt = `...`;

  // Add your feature prompt
  const featureSection = `\n\n## Feature Guidance\n\n${FEATURE_NAME_PROMPT}`;

  return basePrompt + featureSection + memorySuffix;
}
```

### 4. Test Prompt Integration

- [ ] Verify prompt appears in system message
- [ ] Test LLM follows prompt guidance
- [ ] Check token count impact
- [ ] Document any thresholds in logs

---

## Memory & Logging System

### Implementation Log (`docs/03-LOGS/implementation-log.md`)

**Daily record of what was done and why.**

```markdown
## [Date]

### Tasks Completed

- [x] Task 1: Brief description
  - Details: [Technical notes]
  - Time: [Duration]
  - Issues: [Any problems]

- [x] Task 2: Brief description

### Discoveries

- Found that [X] works differently than expected
- Learned that [Y] is the pattern in this codebase

### Next

- [ ] Task 3 continuation
- [ ] Setup/review for next session
```

### Decisions Log (`docs/03-LOGS/decisions-log.md`)

**Significant architecture or design decisions.**

```markdown
### [Date] - [Decision Title]

**Context:** What problem needed solving?
**Options:** [Option A], [Option B], [Option C]
**Decision:** We chose [Option A] because...
**Tradeoffs:** Benefits and downsides
**Impact:** What code/system changes as result
**Status:** [Implemented|Testing|At-Risk]
```

### Bug Log (`docs/03-LOGS/bug-log.md`)

**Track bugs found and how they were fixed.**

```markdown
### Bug: [Title]

**Symptoms:** What goes wrong?
**Root Cause:** Why does it happen?
**Fix:** What did we change?
**Test:** How do we verify it's fixed?
**Lessons:** What to watch for in future
```

### Insights Log (`docs/03-LOGS/insights.md`)

**Long-term learnings and patterns.**

```markdown
## Pattern: [Name]

**Description:** What is this pattern?
**Where Used:** [Files/modules]
**Benefits:** Why use it?
**Cautions:** When to be careful

## Lesson: [Name]

**What We Learned:** What did we discover?
**Applied To:** How did we apply it?
**Future Applications:** Where else could this help?
```

---

## Code Review Process (Human + LLM)

### Before Committing

1. **Self-Review:**

   ```bash
   # Check diff
   git diff

   # Run tests
   npm run test
   npm run type-check
   npm run lint
   ```

2. **Use LLM for Code Review:**
   - Reference: `/code-review-prompt.md` (if created)
   - Ask about: Convention adherence, edge cases, performance
   - Focus on: Architecture, not style (linter handles that)

3. **Update Implementation Log:**
   - Mark task as complete
   - Note any last-minute changes
   - Document any edge cases discovered

### Before Merging

1. **Final Checks:**
   - [ ] All tests pass
   - [ ] No type errors
   - [ ] Documentation updated
   - [ ] Logs up-to-date

2. **Create Commit Message:**

   ```
   [type](scope): description

   Body explaining:
   - What changed and why
   - Any references to issues/features
   - Notes for future developers
   ```

---

## Weekly Review (Friday)

### 1. Update System State (5 min)

```bash
# Reflect what changed this week
cat docs/00-CONTEXT/system-state.md
# Update: new features, completed items, blockers
```

### 2. Review Insights (10 min)

```bash
# Read what you learned
cat docs/03-LOGS/insights.md | tail -100
# Consolidate patterns for future
```

### 3. Plan Next Week (10 min)

```bash
# Review upcoming features
cat docs/02-FEATURES/*/dev-tasks.md
# Update priorities based on learnings
```

### 4. Push to GitHub\*\*

```bash
git push origin main
```

**Track Progress:**

- Commits this week: `git log --since "7 days ago" | wc -l`
- Files changed: `git log --since "7 days ago" --stat | tail -5`
- Toward 1000 contributions: `git shortlog -sn | head -1`

---

## Collaboration with LLM

### Effective Prompting

**Good prompt:**

```
I'm implementing feature X which [does Y].
Current approach: [Architecture]
I'm at this point: [What's done, what's next]
Challenge: [Specific problem]

How would you approach this? Consider:
1. [Concern 1]
2. [Concern 2]
```

**Then:**

- Ask LLM to review the design
- Ask for edge cases
- Ask for optimization opportunities
- Ask to implement most of it (you guide)

### Avoiding Common Pitfalls

❌ **Don't:** "Implement feature X" (without context)
✅ **Do:** "Implement X using the pattern from file Y, with these constraints..."

❌ **Don't:** Accept all generated code without review
✅ **Do:** Review code, understand it, ask for changes

❌ **Don't:** Skip logging/documentation
✅ **Do:** Document as you go, log decisions

---

## File Structure Reference

```
docs/
├── 00-CONTEXT/                    ← Foundation
│   ├── README.md
│   ├── vision.md
│   ├── assumptions.md
│   └── system-state.md
│
├── 01-PRODUCT/                    ← Requirements
│   ├── README.md
│   └── prd.md
│
├── 02-FEATURES/                   ← Implementation
│   ├── README.md
│   ├── FEATURE_TEMPLATE.md
│   └── feature-{name}/
│       ├── feature-spec.md
│       ├── tech-design.md
│       ├── dev-tasks.md
│       ├── test-plan.md
│       └── implementation-log.md
│
├── 03-LOGS/                       ← Memory
│   ├── implementation-log.md
│   ├── decisions-log.md
│   ├── bug-log.md
│   ├── validation-log.md
│   ├── insights.md
│   └── SESSION_YYYYMMDD_HHMMSS.md
│
└── 04-PROCESS/                    ← Workflow
    ├── README.md
    ├── dev-workflow.md            ← This file
    ├── definition-of-done.md
    └── dev-prompts.md
```

---

## Troubleshooting

### "Lost context of why I made a decision"

→ Check `decisions-log.md` for date range

### "Not sure if feature is complete"

→ Reference `DEFINITION_OF_DONE.md` checklist

### "Need to onboard new person"

→ Have them read: Context → Product → Active Features

### "Performance degraded, don't know why"

→ Check `bug-log.md` for recent changes

---

## Success Metrics

Track weekly:

- **Commits:** Target 7+/week (toward 1000/year)
- **Documentation:** Up-to-date (0 stale files)
- **Test Coverage:** 80%+
- **Production Issues:** 0 regressions
- **Learning Rate:** New patterns/insights per week

---

## Quick Commands

```bash
# Start session
echo "## $(date +%Y-%m-%d %H:%M)" >> docs/03-LOGS/implementation-log.md

# Update logs
git add docs/ && git commit -m "docs: update logs"

# Review week
git log --since="7 days ago" --oneline

# Check status
npm run type-check && npm run test && npm run lint

# Push progress
git push origin main

# View contribution stats
git shortlog -sn
```

---

**Last Updated:** January 15, 2026
**Focus:** Qwen Code development with system prompt integration
**Goal:** 1000 GitHub contributions through consistent, documented development
