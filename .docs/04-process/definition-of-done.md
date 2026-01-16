# Definition of Done

This checklist defines when work is complete and ready to ship.

## Code Quality Gates ✅

- [ ] Code passes `npm run type-check` (zero TypeScript errors)
- [ ] Code passes `npm run test` (all tests passing)
- [ ] Tests added for new code (80%+ coverage for new code)
- [ ] No console.log or debug statements left
- [ ] Code follows project conventions (checked by linter)

## Documentation Gates ✅

- [ ] Implementation documented in implementation-log.md
- [ ] Any architectural decisions documented in decisions-log.md
- [ ] Complex logic has comments explaining "why"
- [ ] User-facing features documented in feature spec
- [ ] If docs changed, update relevant markdown files

## Review Gates ✅

- [ ] Code passes `/review` command (manual review of quality)
- [ ] Security concerns addressed (if applicable)
- [ ] Performance implications considered (if applicable)
- [ ] Accessibility checked (if applicable)

## Integration Gates ✅

- [ ] Related features tested together (if dependencies exist)
- [ ] No breaking changes to existing APIs
- [ ] Backward compatibility maintained (or explicitly deprecate)
- [ ] Database migrations tested (if applicable)

## Deployment Gates ✅

- [ ] Build passes: `npm run build`
- [ ] No warnings in build output
- [ ] All imports resolved correctly
- [ ] Ready for production

## Sign-Off ✅

- [ ] Developer: "I believe this is done"
- [ ] Code review: "Approved for shipping"
- [ ] QA/Validation: "Tested and working"

## When to Mark Complete

Mark work as "DONE" only when ALL checkboxes are complete. Use `/done` command to validate.

## What Happens After Done

1. Feature moves to main branch
2. Implementation log updated with completion date
3. Insights documented (what we learned)
4. Celebrate! 🎉

## What If Something Is Missing?

1. `/done` command will show missing items
2. Go back and complete those items
3. Re-run `/done` to validate
4. Never force completion just to "finish"

## Notes

- This is a team standard, not a suggestion
- Different projects might have different gates
- But the principle is: explicit definition, objective measurement
- No subjective "looks good" decisions
