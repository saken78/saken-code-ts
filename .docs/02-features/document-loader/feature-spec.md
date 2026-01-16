# Feature: Document-Aware Prompt Injection

## Overview

Create a service that automatically loads and injects project documentation into LLM prompts, eliminating hallucination about "what was decided".

## User Stories

### Story 1: Load Documentation

As a developer, I want to load project documentation
So that I have full context before making decisions

```gherkin
Given I'm in a Qwen Code session
When I run /docs
Then system loads 00-context/ (vision, assumptions, state)
And system displays a summary of loaded docs
And subsequent prompts include this context
```

### Story 2: Get Project Vision

As a developer, I want to remind myself of project boundaries
So that I don't make decisions that conflict with vision

```gherkin
Given I'm in a Qwen Code session
When I run /vision
Then system shows vision.md content
And I understand project purpose & boundaries
```

### Story 3: Load Product Requirements

As a developer, I want to access product requirements
So that I implement features according to spec, not guesses

```gherkin
Given I'm in a Qwen Code session
When I run /product
Then system loads prd.md
And subsequent prompts reference product requirements
```

### Story 4: Check Implementation Progress

As a developer, I want to see what's been done
So that I know what to work on next

```gherkin
Given I'm in a Qwen Code session
When I run /progress
Then system shows implementation-log.md
And displays completed vs remaining tasks
```

## Acceptance Criteria

- [ ] /docs command loads and displays 00-context/\* files
- [ ] /vision command shows vision.md with readability
- [ ] /product command loads prd.md into context
- [ ] /progress command shows implementation-log.md summary
- [ ] All commands integrate with prompt injection (context preserved in conversation)
- [ ] File not found errors are handled gracefully
- [ ] Commands work even if some doc files are missing

## Technical Requirements

- DocumentLoaderService must support:
  - Read .docs/\* structure
  - Parse markdown files
  - Detect missing files gracefully
  - Handle relative/absolute paths correctly
  - Cache loaded docs for performance

## Edge Cases

1. No .docs/ folder → show helpful error message
2. .docs/ folder exists but empty → show what's expected
3. Individual doc file missing → load what exists, note what's missing
4. Very large docs (>50KB) → still load but maybe summarize for context

## Open Questions

- Should we auto-load docs on session start or only on explicit command?
- How much of large docs to inject (full vs summary)?
- Should missing docs block the /docs command or just warn?

## Related Docs

- See tech-design.md for implementation approach
- See definition-of-done.md for acceptance validation
