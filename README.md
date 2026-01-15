<div align="center">

# Saken Code - TypeScript Development

![GitHub Stars](https://img.shields.io/github/stars/saken78/saken-code-ts.svg)
![License](https://img.shields.io/github/license/saken78/saken-code-ts.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![Contributions](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)

**A personalized development fork of Qwen Code with custom agents, skills, and intelligent prompt injection.**

</div>

## About This Project

This is a **personal development repository** for experimenting with Qwen Code enhancements, including:

- ✅ **Custom Agents & Skills Integration** - High-priority agents/skills in core system prompt
- ✅ **Intelligent Prompt Injection** - Multi-factor analysis replaces naive "every 20 turns" approach
- ✅ **Hallucination Detection** - Pattern-based detection for speculation without data
- ✅ **Advanced Metrics Tracking** - Conversation complexity, error patterns, tool usage
- ✅ **Data-Driven Responses** - Critical protocol for config files (YAML/TOML/XML)

**Status:** Development phase - testing and optimizing core enhancements

## Quick Links

- 📄 [Development Summary](./plans/SESSION_2025_01_14_COMPREHENSIVE_SUMMARY.md) - Complete implementation details
- 🔧 [Installation Guide](#installation)
- 📖 [Usage](#usage)
- 🎯 [Development Goals](#development-goals)

## Features

### 1. Intelligent Prompt Injection Service

Replaces naive "every 20 turns" with multi-factor analysis:

- **Conversation Depth** - Detects 4+ consecutive assistant turns
- **Complexity Spike** - Monitors complexity score (threshold: 50)
- **Error Pattern** - Tracks 2+ errors encountered
- **Hallucination Indicators** - Detects 5 pattern types (speculation, config analysis, etc.)
- **Tool Usage Spike** - Alerts on 8+ tools used rapidly
- **Extended Conversation** - Fallback injection at ~25 turns

### 2. Custom Agents (HIGH PRIORITY)

```
explorer           - Codebase navigation & discovery
planner            - Task decomposition & planning
debugger           - Error analysis & fixing
reviewer           - Code quality & security review
content-analyzer   - Config file analysis
shadcn-migrator    - Component migration
java-gui           - Java GUI development
```

### 3. Custom Skills (Data-Driven)

```
/format-validator       - Config validation (YAML/TOML/XML)
/git-analyzer          - Git history analysis
/error-parser          - Stack trace parsing
/type-safety-analyzer  - TypeScript type checking
/security-audit        - Vulnerability scanning
/file-structure-analyzer - Architecture analysis
```

### 4. Hallucination Prevention

Detects patterns that indicate speculation:

- Speculation without verification
- Config analysis without validation
- Error analysis without /error-parser
- Type claims without /type-safety-analyzer
- Security claims without /security-audit

## Installation

### Prerequisites

```bash
# Node.js 20+
node --version
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/saken78/saken-code-ts.git
cd saken-code-ts

# Install dependencies
npm install

# Build the project
npm run build

# (Optional) Link for local testing
npm link
```

### Global Installation

```bash
npm install -g @qwen-code/qwen-code@latest
```

## Usage

### Interactive Mode

```bash
cd your-project/
qwen
```

### Headless Mode

```bash
qwen -p "your question"
```

### Quick Commands

```bash
qwen --help          # Show all commands
qwen --version       # Show version
qwen --clear-cache   # Clear cache
```

### Session Commands

- `/help` - Display available commands
- `/clear` - Clear conversation history
- `/compress` - Compress history to save tokens
- `/stats` - Show current session information
- `/auth` - Switch authentication methods
- `/exit` - Exit Qwen Code

## Configuration

### User Settings

```bash
~/.qwen/settings.json
```

### Project Settings

```bash
./.qwen/settings.json
```

### Environment Variables

```bash
# OpenAI-compatible API
export OPENAI_API_KEY="your-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"
export OPENAI_MODEL="gpt-4o"

# Qwen OAuth (if using Qwen API)
# Sign in with /auth command
```

## Development Goals

### Phase 1: Core Implementation ✅

- [x] Integrate agents/skills into system prompt
- [x] Implement prompt injection service
- [x] Add hallucination pattern detection
- [x] Create metrics tracking system
- [x] Document architecture

### Phase 2: Testing & Validation (In Progress)

- [ ] Unit tests for PromptInjectionService
- [ ] Integration tests for client
- [ ] Manual testing scenarios
- [ ] Performance profiling
- [ ] Threshold tuning

### Phase 3: Monitoring & Optimization

- [ ] Add metrics logging
- [ ] Performance monitoring dashboard
- [ ] Adaptive threshold learning
- [ ] User feedback loop

### Phase 4: Documentation & Release

- [ ] Developer guide
- [ ] User guide for agents/skills
- [ ] Best practices documentation
- [ ] Release notes

## Project Structure

```
saken-code-ts/
├── packages/
│   ├── cli/                    # Command-line interface
│   ├── core/                   # Core agent logic
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── client.ts           # Main client with injection
│   │   │   │   └── prompts.ts          # System prompt integration
│   │   │   ├── prompts/
│   │   │   │   ├── agents-skills/      # NEW: Agents/skills docs
│   │   │   │   └── reminders/          # Reminder system
│   │   │   ├── services/
│   │   │   │   └── promptInjectionService.ts  # NEW: Injection logic
│   │   │   └── subagents/              # Agent definitions
│   │   └── dist/                       # Compiled output
│   └── sdk-typescript/         # TypeScript SDK
├── plans/
│   └── SESSION_2025_01_14_COMPREHENSIVE_SUMMARY.md
└── README.md                   # This file
```

## Key Files

### Core Implementation

- **`packages/core/src/services/promptInjectionService.ts`**
  - Multi-factor hallucination detection
  - Metrics tracking
  - Smart injection logic

- **`packages/core/src/prompts/agents-skills/index.ts`**
  - HIGH PRIORITY agents documentation
  - Custom skills reference
  - Critical protocol for config files

- **`packages/core/src/core/client.ts`**
  - Integration point for prompt injection
  - Metrics collection
  - Tool usage tracking

- **`packages/core/src/core/prompts.ts`**
  - Core system prompt
  - Agents/skills integration
  - Data-driven response protocol

## Metrics & Thresholds

### Prompt Injection Triggers

```typescript
MIN_TURNS_BETWEEN_INJECTION = 5
COMPLEXITY_THRESHOLD = 50
ERROR_THRESHOLD = 2
CONSECUTIVE_ASSISTANT_TURNS_THRESHOLD = 4
TOOL_USAGE_SPIKE_THRESHOLD = 8
EXTENDED_CONVERSATION_FALLBACK = ~25 turns
```

### Complexity Score Calculation

```
Base: conversation_length (max 50 points)
+ Complex keywords × 5 points each
+ Tool usage × 2 points
+ Agent delegation × 3 points
= Final score (capped at 100)
```

## Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Build specific package
npm run build -- packages/core
npm run build -- packages/cli

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test
```

## Contributing

This is a personal development project. If you want to:

- **Fork**: Create your own fork and make improvements
- **Share Ideas**: Open an issue with suggestions
- **Report Issues**: Use GitHub issues for bugs

## Progress Tracking

**Goal:** 1000 GitHub contributions by maintaining active development

**Current Stats:**

- Repository: saken-code-ts
- Active Development: Yes
- Focus: Agent/skill integration + intelligent prompt injection

## License

This project is based on [Qwen Code](https://github.com/QwenLM/qwen-code) by QwenLM.

Modifications and enhancements are personal development work.

## Resources

- 📖 [Qwen Code Documentation](https://qwenlm.github.io/qwen-code-docs/)
- 🔗 [Original Qwen Code Repository](https://github.com/QwenLM/qwen-code)
- 💬 [Qwen Team Discussion](https://github.com/QwenLM/Qwen3-Coder)

## Session Notes

### Latest Session (January 14, 2025)

**Status:** Complete & Compiled

**Achievements:**

- ✅ Integrated custom agents/skills with HIGH PRIORITY markers
- ✅ Implemented intelligent prompt injection (multi-factor analysis)
- ✅ Added hallucination pattern detection (5 types)
- ✅ Created metrics tracking system
- ✅ All code compiled without errors
- ✅ Comprehensive documentation

**Next:** Testing, validation, and performance tuning

See [Full Session Summary](./plans/SESSION_2025_01_14_COMPREHENSIVE_SUMMARY.md) for details.

## Support

For questions about this personal development project:

- Check the [Session Summary](./plans/SESSION_2025_01_14_COMPREHENSIVE_SUMMARY.md)
- Review code comments and documentation
- Check GitHub issues

---

**Last Updated:** January 15, 2026
**Maintained by:** saken78
