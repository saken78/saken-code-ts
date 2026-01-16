# Project Assumptions & Risks

## Key Assumptions

1. **TypeScript/JavaScript** - Primary language is TS/JS (but architecture is language-agnostic)
2. **Git repositories** - All projects are git repos (enables branch-based phase detection)
3. **Documentation discipline** - Teams will maintain BMAD doc structure
4. **Conversation-based workflow** - Users work in single sessions or checkpoint their progress
5. **LLM consistency** - Using Qwen model (can adapt for other models)
6. **File system access** - Can read/write project documentation

## Known Risks

1. **Doc staleness** - If docs aren't updated, LLM gets stale context
   - Mitigation: /compress command reminds user to update docs
   - Mitigation: Git diff shows what changed since last doc update

2. **Prompt injection conflicts** - Multiple injections could override each other
   - Mitigation: Layered injection with priority ordering
   - Mitigation: System-level injection > message-level injection

3. **Memory explosion** - decisions-log.md / bug-log.md could get huge
   - Mitigation: Auto-archive old entries (6+ months)
   - Mitigation: Compress command summarizes into "lessons learned"

4. **Team misalignment** - Different developers interpret doc structure differently
   - Mitigation: Provide canonical templates for each doc type
   - Mitigation: /template command generates boilerplate

## Unknowns

1. **Scalability** - How does this work for 10,000+ line projects?
2. **Multi-LLM** - How to adapt for different LLM backends?
3. **Integration** - How does this work with existing IDEs (VS Code, JetBrains)?
4. **Privacy** - How to handle private/sensitive docs in teams?

## Validation Plan

- [ ] Test with 3-5 real projects
- [ ] Measure hallucination reduction (before/after)
- [ ] Survey 10+ developers on workflow improvement
- [ ] Benchmark doc loading performance
