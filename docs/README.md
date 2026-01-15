# Qwen Code Documentation System

**Purpose:** Unified documentation for context, product, features, and process
**Status:** Active (Updated January 15, 2026)
**Goal:** Support development toward 1000 GitHub contributions

---

## 🎯 Quick Start

### For New Developers

1. Read: `00-CONTEXT/vision.md` (Why we exist)
2. Read: `01-PRODUCT/prd.md` (What we're building)
3. Read: `04-PROCESS/dev-workflow.md` (How we work)
4. Pick a feature in `02-FEATURES/` and start coding

### For Continuing Development

1. Check: `03-LOGS/implementation-log.md` (What changed)
2. Reference: `04-PROCESS/DEFINITION_OF_DONE.md` (Checklist)
3. Work on task in `02-FEATURES/feature-*/dev-tasks.md`
4. Update logs as you progress

### For System Prompt Integration

1. Reference: `04-PROCESS/SYSTEM_PROMPTS_GUIDE.md` (How it works)
2. Study: `/claude-code-system-prompts/system-prompts/` (Patterns)
3. Implement: `packages/core/src/prompts/features/` (Your feature)
4. Test: Verify LLM behavior follows prompt

---

## 📂 Directory Structure

### `00-CONTEXT/` — Foundation

**What:** Why Qwen Code exists, what we assume, what's built

- **`vision.md`** - Product purpose & boundaries
- **`assumptions.md`** - Core beliefs & validation status
- **`system-state.md`** - Current architecture & features
- **`README.md`** - Guide for using context files

**Use when:** Planning features, onboarding, strategic decisions

---

### `01-PRODUCT/` — Requirements

**What:** What we're building and why (single source of truth)

- **`prd.md`** - Product requirements document
- **`README.md`** - Overview

**Use when:** Understanding feature requirements, scope boundaries

---

### `02-FEATURES/` — Implementation

**What:** How features are designed, built, and tested

```
feature-{name}/
├── feature-spec.md       ← What (acceptance criteria)
├── tech-design.md        ← How (architecture)
├── dev-tasks.md          ← Tasks (breakdown)
├── test-plan.md          ← Testing strategy
└── implementation-log.md ← Running journal
```

**Files:**

- **`FEATURE_TEMPLATE.md`** - Template for new features
- **`README.md`** - Guide for feature documentation

**Use when:** Implementing features, understanding architecture

---

### `03-LOGS/` — Memory

**What:** Implementation history, decisions, bugs, learnings

- **`implementation-log.md`** - Daily progress (what got done)
- **`decisions-log.md`** - Architecture & design decisions
- **`bug-log.md`** - Bugs found and how they were fixed
- **`validation-log.md`** - Testing & QA results
- **`insights.md`** - Patterns, learnings, best practices
- **`SESSION_*.md`** - Session-specific notes

**Use when:** Understanding why decisions were made, reviewing progress

---

### `04-PROCESS/` — Workflow

**What:** How to work effectively with this codebase

- **`dev-workflow.md`** - Daily development cycle & collaboration
- **`DEFINITION_OF_DONE.md`** - Checklist for "done"
- **`SYSTEM_PROMPTS_GUIDE.md`** - How to integrate system prompts
- **`README.md`** - Overview

**Use when:** Starting work, ensuring quality, integrating features

---

## 🔄 Workflow: Documentation → Code → Logs

### Planning Phase

```
00-CONTEXT/  ← Understand foundation
     ↓
01-PRODUCT/  ← Check requirements
     ↓
02-FEATURES/FEATURE_TEMPLATE.md ← Create feature spec
```

### Implementation Phase

```
02-FEATURES/feature-name/
├── feature-spec.md      ← Reference while coding
├── tech-design.md       ← Reference architecture
├── dev-tasks.md         ← Track progress
└── implementation-log.md ← Update daily
     ↓
packages/core/src/  ← Your code
     ↓
04-PROCESS/DEFINITION_OF_DONE.md ← Validate completeness
```

### Memory Phase

```
03-LOGS/
├── implementation-log.md ← Record what was done
├── decisions-log.md      ← Record why decisions
├── bug-log.md           ← Record bugs & fixes
└── insights.md          ← Record learnings
```

---

## 📋 Key Processes

### Daily Development

See: `04-PROCESS/dev-workflow.md` → Daily Development Cycle

1. **Morning (15 min):** Review context, check progress, select tasks
2. **Midday (4-6 hours):** Implement, test, commit regularly
3. **Evening (30 min):** Push, document learnings, update logs

### Feature Development

See: `04-PROCESS/dev-workflow.md` → Feature Development Workflow

1. Plan in `02-FEATURES/feature-name/`
2. Implement in `packages/core/src/`
3. Test per `test-plan.md`
4. Update logs in `03-LOGS/`

### System Prompt Integration

See: `04-PROCESS/SYSTEM_PROMPTS_GUIDE.md`

1. Reference patterns in `/claude-code-system-prompts/system-prompts/`
2. Create prompt in `packages/core/src/prompts/features/`
3. Import in `packages/core/src/core/prompts.ts`
4. Test LLM behavior

### Quality Assurance

See: `04-PROCESS/DEFINITION_OF_DONE.md`

Use checklist for:

- Code quality
- Testing
- Documentation
- Performance
- Security
- Sign-off

---

## 🎓 Learning Paths

### Learn Qwen Code Architecture

1. `00-CONTEXT/system-state.md` - Current architecture
2. `packages/core/src/core/prompts.ts` - Prompt system
3. `04-PROCESS/SYSTEM_PROMPTS_GUIDE.md` - How prompts work
4. Review 2-3 features in `02-FEATURES/*/tech-design.md`

### Learn Development Process

1. `04-PROCESS/dev-workflow.md` - Daily workflow
2. `04-PROCESS/DEFINITION_OF_DONE.md` - Quality checklist
3. Pick a feature task and follow it end-to-end
4. Read logs in `03-LOGS/` to see real examples

### Learn Feature Implementation

1. `02-FEATURES/FEATURE_TEMPLATE.md` - Template
2. Pick a feature that interests you
3. Read its `feature-spec.md` (what)
4. Read its `tech-design.md` (how)
5. Read `dev-tasks.md` (breakdown)
6. Read `implementation-log.md` (what actually happened)

### Learn From Past Decisions

1. `03-LOGS/decisions-log.md` - Architectural decisions
2. Find decisions relevant to your feature
3. Understand context, options considered, rationale
4. Apply patterns to your own work

---

## 📊 Integration Map

```
┌─────────────────────────────────────────────────────────┐
│ 00-CONTEXT: Foundation (Why, Assumptions, State)       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 01-PRODUCT: Requirements (What to Build)               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 02-FEATURES: Implementation (Design & Code)             │
│                                                         │
│ ├─ feature-spec.md  ──────────┐                        │
│ ├─ tech-design.md   ──────────┤                        │
│ ├─ dev-tasks.md     ──────────┼──→ packages/core/src/ │
│ ├─ test-plan.md     ──────────┤    (Your Code)       │
│ └─ impl-log.md      ──────────┘                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
    ┌────────────────────────────┐
    │ packages/core/src/         │
    │ (prompts.ts integration) ←─┼─→ /claude-code-system-prompts/
    │                            │
    └────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 04-PROCESS: Workflow & Quality                          │
│                                                         │
│ ├─ dev-workflow.md ────→ Daily development cycle       │
│ ├─ DEFINITION_OF_DONE ──→ Quality checklist            │
│ └─ SYSTEM_PROMPTS_GUIDE → Prompt integration           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────┐
│ 03-LOGS: Memory (What Changed, Why, Learnings)         │
│                                                         │
│ ├─ implementation-log.md ─→ Daily progress             │
│ ├─ decisions-log.md ──────→ Design decisions          │
│ ├─ bug-log.md ────────────→ Issues & fixes            │
│ ├─ validation-log.md ─────→ Testing results           │
│ └─ insights.md ───────────→ Patterns & learnings      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔗 Quick Links

**Getting Started**

- 📖 [Dev Workflow](./04-PROCESS/dev-workflow.md) - Daily cycle
- ✅ [Definition of Done](./04-PROCESS/DEFINITION_OF_DONE.md) - Checklist
- 🎨 [Feature Template](./02-FEATURES/FEATURE_TEMPLATE.md) - Template

**Understanding**

- 💡 [Vision](./00-CONTEXT/vision.md) - Why we exist
- 📊 [System State](./00-CONTEXT/system-state.md) - What's built
- 📋 [Product Spec](./01-PRODUCT/prd.md) - What to build

**Implementing**

- 🔌 [System Prompts Guide](./04-PROCESS/SYSTEM_PROMPTS_GUIDE.md) - How to integrate
- 📝 [Decisions Log](./03-LOGS/decisions-log.md) - Why we did it
- 📈 [Implementation Log](./03-LOGS/implementation-log.md) - What we did

**Learning**

- 📚 [Insights](./03-LOGS/insights.md) - What we learned
- 🐛 [Bug Log](./03-LOGS/bug-log.md) - What went wrong
- 📌 [Assumptions](./00-CONTEXT/assumptions.md) - What we believe

---

## 📊 Documentation Checklist

Use this to ensure docs stay current:

### Weekly

- [ ] `implementation-log.md` updated with this week's work
- [ ] `insights.md` has this week's learnings
- [ ] No stale feature `dev-tasks.md` files
- [ ] `system-state.md` reflects current architecture

### Per Feature

- [ ] Feature has complete `feature-spec.md`
- [ ] Feature has `tech-design.md`
- [ ] Feature has `dev-tasks.md` with clear breakdown
- [ ] Feature has `test-plan.md`
- [ ] Feature's `implementation-log.md` is up-to-date

### Per Commit

- [ ] Related logs updated (`implementation-log.md` or feature `impl-log.md`)
- [ ] If decision made: Added to `decisions-log.md`
- [ ] If bug found: Added to `bug-log.md`
- [ ] Commit message references related feature/doc

---

## 🎯 Success Metrics

Track weekly to measure progress:

**Contributions**

- [ ] 7+ commits this week (toward 1000/year)
- [ ] Features documented in `02-FEATURES/`
- [ ] Logs updated: `implementation-log.md`

**Documentation Quality**

- [ ] 0 stale files (all current)
- [ ] All decisions documented
- [ ] Clear implementation logs

**Code Quality**

- [ ] 80%+ test coverage
- [ ] All tests pass
- [ ] Type checking clean

**Learning**

- [ ] New insights logged
- [ ] Patterns identified
- [ ] Decisions documented

---

## 🚀 Starting Your Session

### Copy-Paste These Commands

```bash
# 1. Review context (5 min)
cat docs/00-CONTEXT/vision.md
cat docs/00-CONTEXT/assumptions.md

# 2. Check progress (5 min)
git log --since="24 hours ago" --oneline
tail -50 docs/03-LOGS/implementation-log.md

# 3. Select tasks (5 min)
cat docs/02-FEATURES/feature-*/dev-tasks.md | grep "^\- \[ \]"

# 4. Start session
echo "## $(date)" >> docs/03-LOGS/implementation-log.md

# 5. Work...
# (Edit code, run tests, commit regularly)

# 6. End session
git add docs/ && git commit -m "docs: update logs"
git push origin main
```

---

## 📞 Help & Support

**"How do I...?"**

| Question                    | Answer                                   |
| --------------------------- | ---------------------------------------- |
| Start a new feature?        | See `02-FEATURES/FEATURE_TEMPLATE.md`    |
| Know if I'm done?           | Check `04-PROCESS/DEFINITION_OF_DONE.md` |
| Integrate a system prompt?  | See `04-PROCESS/SYSTEM_PROMPTS_GUIDE.md` |
| Understand a past decision? | Check `03-LOGS/decisions-log.md`         |
| Learn from past bugs?       | Check `03-LOGS/bug-log.md`               |
| Get unstuck?                | Check `03-LOGS/insights.md` for patterns |

---

## 📝 Document Standards

### All Documents Should Have

- [ ] Clear purpose statement at top
- [ ] Table of contents (if long)
- [ ] Examples where relevant
- [ ] Links to related documents
- [ ] Last updated date

### Feature Docs Should Have

- [ ] Acceptance criteria (what counts as done)
- [ ] Architecture diagram (how it works)
- [ ] Implementation tasks (what to build)
- [ ] Test plan (how to validate)
- [ ] Implementation log (progress)

### Logs Should Have

- [ ] Date/timestamp
- [ ] What was done/decided/learned
- [ ] Why (context)
- [ ] Impact/next steps
- [ ] Link to related feature

---

## 🔄 Continuous Improvement

This documentation system evolves as you work:

1. **Found a better pattern?** Update this README
2. **Completed a feature?** Move success stories to `insights.md`
3. **Made a decision?** Document in `decisions-log.md`
4. **Hit a blocker?** Document in `bug-log.md`
5. **Learned something?** Update `insights.md`

The system is designed to capture and preserve knowledge.

---

## 📚 References

**Inside This Repo**

- 📁 Qwen Code source: `packages/core/src/`
- 📁 System prompts reference: `/claude-code-system-prompts/`
- 📄 Core prompt integration: `packages/core/src/core/prompts.ts`

**External Resources**

- 🔗 [Qwen Code Documentation](https://qwenlm.github.io/qwen-code-docs/)
- 🔗 [Claude Code System Prompts](https://github.com/Piebald-AI/claude-code-system-prompts)
- 🔗 [Original Qwen Code](https://github.com/QwenLM/qwen-code)

---

## 📋 Version Info

- **Created:** January 14, 2025
- **Updated:** January 15, 2026
- **Status:** Active & Maintained
- **Focus:** 1000 GitHub contributions goal
- **Contributors:** @saken78

---

**This is a living system. Update it as you work. 🚀**
