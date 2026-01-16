# Development Workflow

## Daily Dev Loop (Human + LLM)

### Morning Standup: 5 minutes

```bash
/docs
/progress
/decisions
```

This loads:

- Project documentation (scope, constraints)
- What was completed yesterday
- Recent architectural decisions

### Active Development: 2-4 hours

```bash
/coding implement feature X
# ... iterative implementation ...
# ... use /debug when stuck ...
# ... use /design for architecture questions ...
```

When starting a new feature:

1. Read feature-spec.md
2. Understand tech-design.md
3. Follow dev-tasks.md checklist
4. Write code with `/coding` mode

### Code Review: 15-30 minutes

```bash
/review @src/component.ts
/review for security and performance
```

### Verification: 10 minutes

```bash
/done
# Fix any missing items
npm run test
npm run type-check
/done  # Re-validate
```

### Session Closure: 5 minutes

```bash
/compress
# Summarizes conversation
# Updates logs automatically
```

---

## Phase-Based Workflow

### Planning Phase

```bash
/phase plan
# LLM enters planning mode
# Focus: Requirements, architecture, scope

Commands available:
/vision - Remind of project vision
/product - Load product requirements
/design - Plan architecture
```

### Development Phase

```bash
/phase dev
# LLM enters dev mode
# Focus: Implementation, testing, quality

Commands available:
/coding - Fast implementation
/debug - Root cause analysis
/progress - Check what's done
```

### Review Phase

```bash
/phase review
# LLM enters review mode
# Focus: Quality, security, maintainability

Commands available:
/review - Code review
/done - Validate completion
```

### Release Phase

```bash
/phase release
# LLM enters release mode
# Focus: Stability, documentation, release notes

Commands available:
/product - Finalize product requirements
/decisions - Document release decisions
/compress - Final summary
```

---

## When Context Gets Long

### Option 1: Compress and Continue

```bash
/compress
# Creates summary in implementation-log.md
# Resets conversation but keeps context
# Loads previous context automatically
```

### Option 2: Refresh Memory

```bash
/refresh-memory
# Reloads decisions and bugs from logs
# Continues current conversation
# Better for mid-session context refresh
```

### Option 3: New Session

```bash
Next time you start Qwen Code:
# System automatically loads:
# - implementation-log.md (what was done)
# - decisions-log.md (why it was done)
# - active feature spec
# - recent bugs
# Zero context loss
```

---

## Handling Mistakes & Bugs

When you find a bug:

```bash
/debug describe the issue
# LLM analyzes root cause
# Fix is implemented
# Logged to bug-log.md
```

If a decision was wrong:

```bash
/decisions
# Review recent decisions
# Discuss changes needed
# Update decisions-log.md with rationale
```

If code needs refactoring:

```bash
/review analyze the code
# Identify refactoring opportunities
# Plan changes
/coding refactor following identified patterns
```

---

## Team Coordination

### Handoff Between Developers

```
Developer A:
/compress
# Creates summary

Developer B:
/refresh-memory
# Loads previous work
/docs
# Gets full context
# Continues naturally
```

### Onboarding New Developer

```
New developer:
/docs
/vision
/product
/progress
# Has full context immediately
# No "what was decided?" questions
```

### Architecture Review

```
Tech Lead:
/decisions
/review key components
# See all decisions
# Review critical code
# Provide feedback
```

---

## Best Practices

1. **Run `/docs` at start** - Always know scope and constraints
2. **Use `/phase` for context** - Help LLM understand what mode you're in
3. **Document decisions** - After making architecture decisions, update decisions-log.md
4. **Keep logs updated** - Use `/compress` before context gets too long
5. **Validate with `/done`** - Never skip quality checks
6. **Reference past bugs** - Use `/bugs` before making similar changes

## Tools & Commands Reference

| Command           | Purpose                      | When to Use                      |
| ----------------- | ---------------------------- | -------------------------------- |
| `/docs`           | Load all documentation       | Start of session                 |
| `/vision`         | Show project vision          | Checking scope                   |
| `/product`        | Load product requirements    | Before implementing feature      |
| `/progress`       | Show implementation progress | Planning what to do next         |
| `/phase <name>`   | Switch context mode          | Start of new phase               |
| `/coding`         | Implementation focus         | Writing code                     |
| `/debug`          | Root cause analysis          | Troubleshooting bugs             |
| `/review`         | Code quality review          | Before marking done              |
| `/design`         | Architecture planning        | Planning new features            |
| `/refresh-memory` | Update decision context      | After long conversation          |
| `/decisions`      | Show recent decisions        | Understanding what was decided   |
| `/bugs`           | Reference known bugs         | Before implementing similar code |
| `/done`           | Validate completion          | Before shipping work             |
| `/compress`       | Summarize conversation       | End of long session              |

---

## Definition of Done

Before marking work complete, ensure:

- ✅ Code passes type-check and tests
- ✅ Tests written for new code
- ✅ Code reviewed with `/review`
- ✅ Decisions documented
- ✅ `/done` command validates all checks

See definition-of-done.md for full checklist.
