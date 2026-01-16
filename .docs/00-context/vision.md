# Qwen Code Vision & Purpose

## Project Vision

Qwen Code adalah interactive CLI agent yang membantu developers bekerja lebih efisien dengan specialized prompts dan context-aware guidance.

## Purpose

Enable repeatable, helpful workflows untuk agentic development dengan:

- Context-specific prompts untuk berbagai tahap development
- Document-aware LLM interactions (never hallucinate about decisions)
- Memory injection untuk konsistensi keputusan
- Definition-of-done enforcement untuk quality gates

## Core Boundaries

- Primary use: Software engineering tasks (implementation, debugging, review, design)
- Team size: 1-10 developers
- Project types: TypeScript/JavaScript projects (primary), but extensible
- Key constraint: No breaking changes to existing CLI experience

## Success Criteria

- [ ] All 4 context commands working (/coding, /debug, /review, /design)
- [ ] BMAD doc structure implemented and auto-loaded
- [ ] Memory injection prevents hallucination on decisions
- [ ] Definition-of-Done enforcer working
- [ ] Zero context loss across conversations
- [ ] New team members can onboard using docs

## Key Stakeholders

- Primary: Individual developers using Qwen Code
- Secondary: Teams adopting BMAD methodology
- Tertiary: LLM researchers studying prompt injection patterns
