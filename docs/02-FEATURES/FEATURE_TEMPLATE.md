# Feature Template: [Feature Name]

**Status:** [Planning | In Development | Testing | Complete]
**Epic:** [Parent Epic if applicable]
**Owner:** [@username]
**Created:** [Date]
**Last Updated:** [Date]

---

## 1. Feature Specification

### User Intent

What problem does this solve? Why do users need this?

```
User Story: As a [user type], I want [capability] so that [benefit]
```

### Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
- [ ] Criterion 4

### Out of Scope

What are we explicitly NOT doing in this feature?

- Item 1
- Item 2

---

## 2. Technical Architecture

### Design Overview

```
[ASCII diagram of architecture]

Example:
┌─────────────┐
│  CLI Input  │
└──────┬──────┘
       │
       v
┌──────────────────┐
│  Command Parser  │
└──────┬───────────┘
       │
       v
┌──────────────────┐
│  Feature Handler │
└──────┬───────────┘
       │
       v
┌──────────────────┐
│   Output/UI      │
└──────────────────┘
```

### Components Modified

List all files/modules that will be created or modified:

- `packages/cli/src/ui/commands/` - Command handler
- `packages/core/src/` - Core logic
- `packages/core/src/skills/` - If using skills

### API Contracts

If creating new APIs, define them here:

```typescript
interface FeatureName {
  // Clear interface definition
  method1(): Promise<Result>;
  method2(param: Type): void;
}
```

### Dependencies

- External libraries: [List]
- Internal modules: [List]
- System prompts used: [List - see section below]

### System Prompts Integration

This feature may need custom prompts. Check claude-code-system-prompts:

```
Location: /claude-code-system-prompts/system-prompts/

Relevant Prompts:
- agent-prompt-[name].md - For agent-based features
- tool-description-[name].md - For tool descriptions
- system-prompt-[name].md - For system behavior

Implementation in prompts.ts:
```

Add integration point in `packages/core/src/core/prompts.ts`:

```typescript
import { FEATURE_NAME_PROMPT } from '../prompts/features/feature-name.js';

// In getCoreSystemPrompt():
const featureNameSection = ${FEATURE_NAME_PROMPT}
```

---

## 3. Implementation Tasks

### Phase 1: Foundation (Subtasks)

- [ ] Task 1: [Description]
  - Effort: [S|M|L|XL]
  - Dependencies: [List]
  - Owner: [@]

- [ ] Task 2: [Description]
  - Effort: [S|M|L|XL]
  - Dependencies: [List]
  - Owner: [@]

### Phase 2: Integration (Subtasks)

- [ ] Task 3: [Description]
- [ ] Task 4: [Description]

### Phase 3: Testing & Polish

- [ ] Task 5: [Description]
- [ ] Task 6: [Description]

---

## 4. Test Plan

### Unit Tests

```typescript
// Test file: packages/core/src/features/feature-name.test.ts

describe('FeatureName', () => {
  it('should [behavior]', () => {
    // Test case
  });
});
```

Test coverage target: **80%+**

### Integration Tests

- Test interaction with CLI
- Test with different configurations
- Test error scenarios

### Manual Testing Checklist

- [ ] Feature works in interactive mode
- [ ] Feature works in headless mode
- [ ] Error messages are clear
- [ ] Performance is acceptable
- [ ] Works on macOS, Linux, Windows
- [ ] Works with different auth types

### Edge Cases to Test

1. [Edge case 1]
2. [Edge case 2]
3. [Edge case 3]

---

## 5. Performance Considerations

### Benchmarks

- Expected response time: [X]ms
- Memory usage: [X]MB
- File I/O operations: [Count]

### Optimization Opportunities

- [Opportunity 1]
- [Opportunity 2]

---

## 6. Documentation

### User Facing

- [ ] Update README.md with feature description
- [ ] Add usage examples
- [ ] Document configuration options
- [ ] Create troubleshooting guide

### Developer Facing

- [ ] Add inline code comments
- [ ] Document architecture decisions
- [ ] Create architecture diagram
- [ ] List design patterns used

### Prompts Documentation

- [ ] Document any new system prompts
- [ ] Link to claude-code-system-prompts repository
- [ ] Document prompt injection points

---

## 7. Implementation Log

**Log all decisions, discoveries, and changes here as you work.**

### Session 1: [Date]

- [x] Task 1 completed
- [x] Discovery: [What you learned]
- [x] Decision: [What you decided and why]
- [ ] Blocker: [Issue that blocks progress]

### Session 2: [Date]

- [x] Resolved: [Previous blocker]
- [x] Task 2 completed

---

## 8. Validation Checklist (Definition of Done)

### Code Quality

- [ ] Code follows project conventions
- [ ] No linting errors
- [ ] TypeScript types are correct
- [ ] No console.log statements (except intentional)
- [ ] Code is reviewed by [reviewer]

### Testing

- [ ] Unit tests pass (80%+ coverage)
- [ ] Integration tests pass
- [ ] Manual testing checklist completed
- [ ] No regressions detected

### Documentation

- [ ] Inline code comments added
- [ ] README updated
- [ ] Architecture documented
- [ ] System prompts integrated

### Performance

- [ ] Performance benchmarks met
- [ ] Memory usage acceptable
- [ ] No N+1 queries or inefficiencies

### Release

- [ ] CHANGELOG updated
- [ ] Version bumped appropriately
- [ ] Release notes written
- [ ] Merged to main branch

---

## 9. Related Issues & PRs

- Issue: [#123](link)
- Related Feature: [feature-name]
- Depends On: [feature-name]

---

## 10. Notes & Learnings

### What Went Well

- [Learning 1]
- [Learning 2]

### What Could Be Better

- [Improvement 1]
- [Improvement 2]

### Future Enhancements

- [Enhancement 1]
- [Enhancement 2]

---

## Quick Links

- 📊 **See logs:** `../03-LOGS/`
- 📋 **See tasks:** `dev-tasks.md`
- 🧪 **See tests:** `test-plan.md`
- 🏗️ **See design:** `tech-design.md`
- 🔄 **See workflow:** `../04-PROCESS/dev-workflow.md`
