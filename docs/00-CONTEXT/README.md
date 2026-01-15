# Context: Product Foundation

This directory contains the foundational understanding of Qwen Code - why it exists, what constraints it operates under, and what's currently built.

**Purpose:** Single source of truth for product boundaries, assumptions, and system state.

---

## Files in This Directory

### `vision.md`

**What:** Product purpose & strategic boundaries
**Why:** Prevents scope creep, aligns team on core mission
**Update Frequency:** Quarterly or when strategy changes
**Key Sections:**

- Core mission statement
- Primary use cases
- Out-of-scope items
- Strategic goals (1-year)

### `assumptions.md`

**What:** Core assumptions about users, architecture, market
**Why:** Makes implicit knowledge explicit, identifies risks
**Update Frequency:** As assumptions are validated or invalidated
**Key Sections:**

- User assumptions (who uses it, how, why)
- Technical assumptions (architecture, dependencies)
- Market assumptions (adoption, competition)
- Risks for each assumption
- Validation status (Validated/Testing/At-Risk)

### `system-state.md`

**What:** What is actually built and running right now
**Why:** Ground truth for "what exists", prevents duplicate work
**Update Frequency:** After each major release (weekly/bi-weekly)
**Key Sections:**

- Architecture diagram (high-level)
- Current features & status
- Known limitations
- Performance characteristics
- Tech stack & versions
- Database schema (if applicable)

---

## How to Use This Context

### For Feature Planning

1. Read `vision.md` to understand strategic fit
2. Read `assumptions.md` to understand constraints
3. Read `system-state.md` to understand current architecture
4. Check if your feature aligns with vision
5. Identify which assumptions it validates/risks

### For New Team Members

1. Start with `vision.md` (why we exist)
2. Read `assumptions.md` (what we believe)
3. Read `system-state.md` (what we have)
4. Move to `../01-PRODUCT/prd.md` (what we're building)

### For Architecture Decisions

1. Reference `system-state.md` for current architecture
2. Check `assumptions.md` for constraints
3. Check `vision.md` for strategic alignment
4. Document decision in appropriate feature folder

---

## Integration with System Prompts

These context files feed into system prompts via `packages/core/src/core/prompts.ts`:

```typescript
// From prompts.ts - system prompt integration
export function getCoreSystemPrompt(
  userMemory?: string,
  model?: string,
): string {
  // Base prompt includes:
  // - Core Mandates (conventions, libraries, style)
  // - Tool descriptions
  // - Agent/Skill documentation (AGENTS_SKILLS_PROMPT)
  // - User memory (from context)
}
```

**How Context Influences Prompts:**

- `vision.md` → Shapes "Core Mandates" section
- `assumptions.md` → Influences constraint warnings
- `system-state.md` → Determines available tools & features

---

## Validation Checklist

- [ ] Vision statement is clear and measurable
- [ ] All major assumptions are documented
- [ ] Assumptions have validation status
- [ ] System state accurately reflects current build
- [ ] Architecture diagram is up-to-date
- [ ] No contradictions between documents
- [ ] Team has reviewed and aligned

---

## References

- 📄 See `../01-PRODUCT/prd.md` for requirements
- 🎯 See `../02-FEATURES/` for implementation details
- 📊 See `../03-LOGS/` for decisions & changes
- 🔄 See `../04-PROCESS/dev-workflow.md` for development cycle
