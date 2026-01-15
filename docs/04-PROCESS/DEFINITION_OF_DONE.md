# Definition of Done (DoD)

**What is "Done"?** A feature/fix is only considered done when ALL items in this checklist are completed.

Use this checklist for:

- ✅ Feature development
- ✅ Bug fixes
- ✅ Refactoring
- ✅ Documentation updates
- ✅ Performance optimizations

---

## Pre-Implementation Checklist

Before starting work, ensure:

- [ ] Feature has clear acceptance criteria in `feature-spec.md`
- [ ] Tech design documented in `tech-design.md`
- [ ] Dependencies identified
- [ ] System prompts requirements identified (if applicable)
- [ ] Test strategy documented in `test-plan.md`
- [ ] Team/reviewer assigned

---

## Code Quality Checklist

### Style & Conventions

- [ ] Code follows project style guide (check similar files)
- [ ] Naming is clear and consistent
- [ ] No dead code (commented-out code removed)
- [ ] No console.log statements (except intentional debugging)
- [ ] TypeScript types are correct
- [ ] No `any` types without comment explaining why
- [ ] No imports of code not in version control

### Best Practices

- [ ] Single responsibility principle followed
- [ ] Functions are reasonably sized (<50 lines typical)
- [ ] Error handling is present
- [ ] Error messages are clear and actionable
- [ ] Comments explain "why" not "what"
- [ ] No magic numbers (use constants)
- [ ] Code follows existing patterns in project

### Architecture

- [ ] Changes follow existing architectural patterns
- [ ] No circular dependencies
- [ ] Proper separation of concerns
- [ ] Public APIs are minimal and well-defined
- [ ] Implementation details are private/internal

---

## Testing Checklist

### Unit Tests

- [ ] Unit tests exist for new code
- [ ] Tests cover happy path
- [ ] Tests cover error cases
- [ ] Tests cover edge cases
- [ ] Test names clearly describe what's tested
- [ ] No test coupling (tests run independently)
- [ ] Tests don't depend on file system/network (mock when needed)
- [ ] All unit tests pass: `npm run test`

**Coverage Target:** 80%+ for new code

### Integration Tests

- [ ] Integration tests exist (if applicable)
- [ ] Tests verify component interaction
- [ ] Tests verify external API calls
- [ ] Tests handle timeouts/failures gracefully
- [ ] All integration tests pass

### Manual Testing

- [ ] Feature works in interactive mode
- [ ] Feature works in headless mode (if applicable)
- [ ] Error cases produce clear error messages
- [ ] Feature works on macOS, Linux, Windows
- [ ] Feature works with different configurations
- [ ] Performance meets expectations
- [ ] No memory leaks (basic check)

### Test Documentation

- [ ] Test strategy documented in `test-plan.md`
- [ ] Edge cases that are tested are listed
- [ ] Known limitations documented

---

## Type Safety Checklist

- [ ] No TypeScript errors: `npm run type-check`
- [ ] All function parameters have types
- [ ] All function return values have types
- [ ] No implicit `any` types
- [ ] Nullability is explicit and handled
- [ ] Generics are used appropriately
- [ ] Types are exported if used externally

---

## Performance Checklist

- [ ] Performance meets acceptance criteria (if specified)
- [ ] No obvious inefficiencies (N+1 queries, etc.)
- [ ] Large operations are async where needed
- [ ] Memory usage is reasonable
- [ ] No unnecessary rebuilds/recalculations
- [ ] Caching used appropriately (if needed)

**Performance Testing:**

- [ ] Benchmarks run and results documented
- [ ] Profiling done for hot paths (if performance-critical)

---

## Documentation Checklist

### Code Documentation

- [ ] Inline comments explain complex logic
- [ ] Public functions have JSDoc/TSDoc comments
- [ ] Public APIs are documented
- [ ] Complex algorithms are explained
- [ ] Why decisions are documented (not what)

### Feature Documentation

- [ ] README updated with feature description
- [ ] Usage examples provided
- [ ] Configuration options documented
- [ ] Troubleshooting section added (if complex)

### System Prompts Documentation

If this feature integrates with system prompts:

- [ ] System prompt created/updated in `packages/core/src/prompts/features/`
- [ ] Prompt follows claude-code-system-prompts pattern
- [ ] Prompt integrated into `prompts.ts`
- [ ] Prompt effect verified (LLM behavior tested)
- [ ] Token count impact assessed
- [ ] Prompt documented in feature spec

### Developer Documentation

- [ ] Architecture documented in `tech-design.md`
- [ ] Key design decisions documented in `decisions-log.md`
- [ ] Implementation approach documented
- [ ] Any gotchas/challenges documented

### User-Facing Documentation

- [ ] CLI help text is clear
- [ ] Error messages guide users to solutions
- [ ] Configuration options are documented
- [ ] Examples are provided

---

## Linting & Formatting Checklist

- [ ] No ESLint errors: `npm run lint`
- [ ] Code is formatted: `npm run format`
- [ ] No TypeScript warnings
- [ ] No deprecated API usage
- [ ] Security warnings addressed

---

## Git & Commit Checklist

### Commits

- [ ] Commits are atomic (one logical change each)
- [ ] Commit messages follow conventional commits
- [ ] Commit messages explain "why" not just "what"
- [ ] No large binary files committed
- [ ] No secrets/credentials committed

### Pull Request/Merge

- [ ] Branch name is descriptive (e.g., `feature/skill-command`)
- [ ] Related issues linked in description
- [ ] Related feature specs linked
- [ ] Changes are reviewed by at least one person
- [ ] All CI checks pass
- [ ] Merge conflicts resolved

---

## Feature-Specific Checklist

### For Agent/Skill Features

- [ ] System prompt/documentation provided
- [ ] Clear when to use this agent/skill
- [ ] Error handling for invalid inputs
- [ ] Agent appears in `/skills` or `/agents` output
- [ ] Documentation links to system-prompts

### For CLI Commands

- [ ] Command help text is clear (visible in `/help`)
- [ ] All arguments are documented
- [ ] All flags are documented
- [ ] Tab completion works (if applicable)
- [ ] Error handling for bad input
- [ ] Works with both interactive and headless mode

### For Performance-Critical Code

- [ ] Benchmarks documented
- [ ] Performance target met
- [ ] Alternative approaches considered
- [ ] Code reviewed for efficiency
- [ ] Profiling data included (if major optimization)

### For Configuration Changes

- [ ] Default behavior unchanged
- [ ] Backward compatibility maintained
- [ ] Migration path documented (if needed)
- [ ] Configuration options validated
- [ ] Invalid config produces clear error

---

## Release Checklist

Before merging to main:

- [ ] CHANGELOG.md updated
- [ ] Version number bumped (if applicable)
- [ ] Release notes written
- [ ] No known regressions
- [ ] All acceptance criteria met
- [ ] Team approval obtained

---

## Post-Merge Checklist

After merging to main:

- [ ] Build passes on CI
- [ ] Tests pass on all platforms
- [ ] No regressions reported
- [ ] Monitor error logs (if applicable)
- [ ] Feature works as expected in production

---

## Logs & Memory Checklist

- [ ] Implementation log updated: `docs/03-LOGS/implementation-log.md`
- [ ] Decisions documented: `docs/03-LOGS/decisions-log.md`
- [ ] Bugs/issues documented: `docs/03-LOGS/bug-log.md`
- [ ] Learnings documented: `docs/03-LOGS/insights.md`
- [ ] System state updated (if major change): `docs/00-CONTEXT/system-state.md`

---

## Accessibility & Inclusion

- [ ] Error messages are clear and non-technical when possible
- [ ] Help text includes examples
- [ ] No hardcoded text values that should be translatable
- [ ] Features work with different terminal settings
- [ ] Colors not used as only indicator (for colorblind users)

---

## Security Checklist

- [ ] No secrets in code
- [ ] No world-readable files created
- [ ] Input validation present
- [ ] Command injection risks mitigated (especially in Bash tool)
- [ ] Path traversal risks addressed
- [ ] No unsafe operations on user input

---

## Checklist for Different Types of Work

### Feature Implementation

Use: Pre-Implementation + Code Quality + Testing + Documentation + Linting + Git + Feature-Specific + Logs

### Bug Fix

Use: Code Quality + Testing + Documentation (update if needed) + Linting + Git + Logs (especially bug-log)

### Refactoring

Use: Code Quality + Testing (verify no behavior changes) + Linting + Git + Documentation (update if needed) + Logs

### Documentation Update

Use: Documentation + Git + Logs (insights)

### Performance Optimization

Use: Code Quality + Performance + Testing + Documentation + Git + Logs (decisions)

---

## Quick Validation

Run before marking as done:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Tests
npm run test

# Format check
npm run format -- --check

# Build
npm run build

# Final check
git status  # Should be clean
git log -1 --oneline  # Shows your commit
```

---

## Sign-Off

When all items are checked:

```markdown
## ✅ Definition of Done: COMPLETE

- Type Safety: ✅
- Testing: ✅ (Coverage: XX%)
- Code Quality: ✅
- Documentation: ✅
- Performance: ✅
- Security: ✅
- Logs/Memory: ✅

Signed off by: [@reviewer]
Date: [YYYY-MM-DD]
```

---

## Common Issues

### Issue: "Too many checklist items"

**Solution:** This is intentional. Not every item applies to every task. Use the "Checklist for Different Types of Work" section to select only relevant items.

### Issue: "This takes too long"

**Solution:** Once you develop the habit, these checks become automatic. They actually save time by preventing bugs and rework.

### Issue: "I don't know how to do item X"

**Solution:**

1. Check existing code for examples
2. Ask in team discussion
3. Reference `docs/02-FEATURES/feature-name/implementation-log.md` for similar work
4. Consult system prompts for LLM guidance

### Issue: "Feature is blocked on item Y"

**Solution:**

1. Document in `docs/03-LOGS/bug-log.md` or implementation log
2. Mark task as blocked
3. Escalate to team
4. Proceed with other work

---

## Review

This DoD is living. Update it when:

- New patterns emerge
- Common issues repeat
- Team discovers better practices
- Technology changes

---

**Last Updated:** January 15, 2026
**Applies to:** All development on Qwen Code personal fork
**Questions:** See `dev-workflow.md` for related processes
