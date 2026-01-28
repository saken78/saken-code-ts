<div align="center">

# Saken Code - TypeScript Development

![GitHub Stars](https://img.shields.io/github/stars/saken78/saken-code-ts.svg)
![License](https://img.shields.io/github/license/saken78/saken-code-ts.svg)
![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![Latest Release](https://img.shields.io/github/v/release/saken78/saken-code-ts.svg)

**A personalized development fork of [Qwen Code](https://github.com/QwenLM/qwen-code) with enhanced agents, custom skills, and advanced features.**

</div>

## About This Project

Saken Code is a development-focused fork of Qwen Code that includes:

- ✅ **Custom Agents & Skills** - Enhanced agents with specialized capabilities
- ✅ **Intelligent Prompt Injection** - Smart context management based on conversation complexity
- ✅ **Hallucination Detection** - Pattern-based detection for speculative responses
- ✅ **Advanced Metrics Tracking** - Conversation analysis and performance monitoring
- ✅ **Enhanced Built-in Agents** - Improved deepthink, react-best-practise, and technical-researcher agents
- ✅ **Data-Driven Responses** - Critical protocol for config file analysis

## Quick Start

### Installation

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

### Usage

```bash
# Interactive mode
cd your-project/
qwen

# Headless mode
qwen -p "your question"

# Help
qwen --help
```

### Session Commands

- `/help` - Display available commands
- `/clear` - Clear conversation history
- `/compress` - Compress history to save tokens
- `/stats` - Show session information
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
# Use /auth command to configure
```

## Features

### Custom Agents

- `explorer` - Codebase navigation & discovery
- `planner` - Task decomposition & planning
- `debugger` - Error analysis & fixing
- `reviewer` - Code quality & security review
- `content-analyzer` - Config file analysis
- `deepthink` - Deep analysis and problem solving
- `react-best-practise` - React/Next.js performance optimization
- `technical-researcher` - Code repository analysis

### Custom Skills

- `/format-validator` - Config validation (YAML/TOML/XML)
- `/git-analyzer` - Git history analysis
- `/error-parser` - Stack trace parsing
- `/type-safety-analyzer` - TypeScript type checking
- `/security-audit` - Vulnerability scanning
- `/file-structure-analyzer` - Architecture analysis

## Project Structure

```
saken-code-ts/
├── packages/
│   ├── cli/                 # Command-line interface
│   ├── core/                # Core agent logic and services
│   └── sdk-typescript/      # TypeScript SDK
├── scripts/                 # Build and development scripts
├── plans/                   # Development documentation
├── LICENSE                  # Apache 2.0 License
├── NOTICE                   # Attribution and copyright notices
└── README.md
```

## Development

### Build from Source

```bash
# Install dependencies
npm install

# Build all packages
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

## License

This project is licensed under the **Apache License 2.0**. See [LICENSE](./LICENSE) file for details.

### Attribution

This project is based on [Qwen Code](https://github.com/QwenLM/qwen-code) by QwenLM.

- **Original Work:** Copyright © 2025 Qwen Team
- **Modifications:** Personal development enhancements

For detailed copyright and attribution information, see [NOTICE](./NOTICE) file.

## Contributing

This is a personal development project. To contribute:

- **Fork** - Create your own fork and make improvements
- **Issues** - Report bugs or suggest features
- **Ideas** - Share ideas in discussions

## Resources

- 📖 [Qwen Code Documentation](https://qwenlm.github.io/qwen-code-docs/)
- 🔗 [Original Qwen Code Repository](https://github.com/QwenLM/qwen-code)
- 💬 [Qwen Team Discussions](https://github.com/QwenLM/Qwen3-Coder)

## Support

For questions about this project:

- Check GitHub issues for existing answers
- Review code comments and documentation
- See implementation examples in `packages/`

---

**Maintained by:** [@saken78](https://github.com/saken78)
**License:** Apache 2.0
**Last Updated:** January 28, 2026
