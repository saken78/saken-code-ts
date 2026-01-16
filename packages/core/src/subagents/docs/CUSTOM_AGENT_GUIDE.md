# Custom Builtin Agent Creation Guide

> **Complete reference for creating custom agents in Qwen Code**

## Overview

Custom agents are specialized AI assistants that automatically trigger based on user request keywords. They have focused capabilities, dedicated tools, and custom system prompts.

**Example:** When user says "analyze the API spec", the `content-analyzer` agent automatically triggers instead of the general-purpose agent.

---

## Architecture

### Agent Levels

```
┌─────────────────────────────────┐
│    Session-level Agents         │  Runtime-provided, per-session
├─────────────────────────────────┤
│    User-level Agents            │  ~/.qwen/agents/*.md (YAML frontmatter)
├─────────────────────────────────┤
│    Project-level Agents         │  .qwen/agents/*.md (YAML frontmatter)
├─────────────────────────────────┤
│    Builtin Agents (THIS GUIDE)  │  src/subagents/builtin/*.ts (TypeScript)
└─────────────────────────────────┘
```

This guide covers **Builtin Agents** (TypeScript-based, always available).

---

## Step 1: Create Agent File

**Location:** `/packages/core/src/subagents/builtin/<agent-name>-agent.ts`

**Example filename:** `content-analyzer-agent.ts`, `api-builder-agent.ts`, `performance-optimizer-agent.ts`

### Minimal Template

```typescript
import type { SubagentConfig } from '../types.js';

export const yourAgentName: SubagentConfig = {
  // ===== REQUIRED FIELDS =====

  // Unique identifier (used in /task command and detection)
  name: 'your-agent-name',

  // Human-readable description (shown to users, used for AI matching)
  description: 'Short description of what this agent does',

  // System prompt (injected when agent is selected)
  systemPrompt: `You are a specialized agent for...`,

  // Tools this agent can use
  tools: ['read_file', 'grep', 'shell'],

  // Keywords that trigger this agent
  triggerKeywords: ['keyword1', 'keyword2', 'keyword3'],

  // Agent level
  level: 'builtin',

  // ===== OPTIONAL FIELDS =====

  // Capabilities for routing
  capabilities: ['capability1', 'capability2'],
};
```

---

## Step 2: Define Required Fields

### 1. **Name** (Required)
```typescript
name: 'content-analyzer'
```
- Unique identifier
- Used in `/task content-analyzer` commands
- Used in agent detection
- **Rules:** lowercase, kebab-case, 20 chars max

### 2. **Description** (Required)
```typescript
description: 'Specialized agent for analyzing document content, extracting key information, and summarizing text.'
```
- Shown to users in agent listings
- Used by detection service to match user requests
- **Length:** 100-200 words recommended
- **Tips:**
  - Start with what it does
  - List 2-3 main capabilities
  - Be specific, not generic

### 3. **System Prompt** (Required)
```typescript
systemPrompt: `You are a Content Analysis Specialist. Your expertise lies in:

CORE COMPETENCIES:
1. Document Analysis
   - Read and understand documents
   - Identify key sections

2. Information Extraction
   - Find specific data points
   - Organize information

WORKFLOW:
1. Understand what user wants
2. Read relevant files
3. Analyze for requested info
4. Present findings clearly

GUIDELINES:
- Reference file names and line numbers
- Use bullet points for structured data
- Ask clarifying questions if needed
`
```

**Best Practices:**
- Use markdown formatting (headers, lists)
- Define core competencies section
- Include workflow steps
- Add specific guidelines
- Mention available tools
- Provide example outputs

### 4. **Tools** (Required)
```typescript
tools: [
  'read_file',        // Single file
  'read_many_files',  // Multiple files
  'grep',             // Pattern search
  'glob',             // File matching
  'shell',            // Commands
  'todo_write',       // Task tracking
  'edit',             // File editing
  'write_file',       // Create files
]
```

**Available Tools:**
- `read_file` - Read single file contents
- `read_many_files` - Batch read multiple files
- `grep` - Search with regex patterns
- `glob` - Find files by pattern
- `shell` - Execute shell commands
- `edit` - Replace text in files
- `write_file` - Create/overwrite files
- `todo_write` - Track tasks
- `task` - Delegate to other agents
- `skill` - Use custom skills

**Selection Guide:**
- Use only tools agent needs
- Don't include unnecessary tools
- Common pattern: read_file + grep + glob

### 5. **Trigger Keywords** (Required)
```typescript
triggerKeywords: [
  'analyze',
  'summarize',
  'extract',
  'find',
  'document',
  'content',
  'specification',
  'requirement',
]
```

**How They Work:**
1. User sends message
2. System checks if message contains these keywords (case-insensitive)
3. If match found → agent confidence gets +0.5 boost
4. Agent with highest confidence is selected

**Rules:**
- Lowercase
- Single words or short phrases
- 5-15 keywords recommended
- Should NOT overlap with general-purpose
- Be specific to agent's purpose

**Common Keywords by Type:**
- Analysis: analyze, examine, inspect, assess
- Planning: plan, organize, schedule, break down
- Review: review, check, audit, evaluate
- Debugging: debug, fix, error, issue
- Documentation: document, explain, describe, guide

---

## Step 3: Add Optional Fields

### 1. **Capabilities**
```typescript
capabilities: [
  'document_analysis',
  'information_extraction',
  'summarization',
  'pattern_recognition',
]
```
- Used by AI routing logic
- Describes what agent can do
- Helps with multi-agent decisions
- Optional but recommended

### 2. **Tools** (Already covered)

### 3. **Level & isBuiltin**
```typescript
level: 'builtin',
isBuiltin: true,
```
- Always these values for builtin agents
- Required for proper registration

---

## Step 4: Export Agent

**File:** `/packages/core/src/subagents/builtin/index.ts`

### Before:
```typescript
import { explorerAgent } from './explorer-agent.js';
import { plannerAgent } from './planner-agent.js';

export const builtinSubagents: Record<string, SubagentConfig> = {
  explorer: explorerAgent,
  planner: plannerAgent,
};
```

### After:
```typescript
import { explorerAgent } from './explorer-agent.js';
import { plannerAgent } from './planner-agent.js';
import { contentAnalyzerAgent } from './content-analyzer-agent.js'; // ADD

export const builtinSubagents: Record<string, SubagentConfig> = {
  explorer: explorerAgent,
  planner: plannerAgent,
  'content-analyzer': contentAnalyzerAgent,  // ADD
};
```

**Steps:**
1. Add `import` statement for your agent
2. Add entry to `builtinSubagents` object
3. Build project: `npm run build`
4. Verify: `npm test` (run test suite)

---

## Step 5: Build & Test

### Build
```bash
cd /home/saken/qwen/qwen-code/packages/core
npm run build
```

### Verify Registration
```bash
# Check agent is in registry
grep "'your-agent-name'" /home/saken/qwen/qwen-code/packages/core/src/subagents/builtin/index.ts
```

### Test Detection (Optional)
```bash
# Run test suite
npm test -- agent-detection.test.ts
```

---

## Complete Example: API Builder Agent

Here's a production-ready example:

```typescript
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 *
 * API Builder Agent
 * Specialized for REST API design, implementation, and documentation
 */

import type { SubagentConfig } from '../types.js';

export const apiBuilderAgent: SubagentConfig = {
  name: 'api-builder',

  description:
    'Specialized agent for designing and implementing REST APIs, generating API documentation, and creating OpenAPI specifications. Handles endpoint design, request/response schemas, authentication, and error handling.',

  systemPrompt: `You are an API Architecture Specialist. Your expertise includes:

CORE COMPETENCIES:
1. API Design
   - RESTful principles and patterns
   - Endpoint structure and naming conventions
   - HTTP methods and status codes
   - Request/response design

2. API Implementation
   - Express.js, FastAPI, or similar frameworks
   - Middleware setup and configuration
   - Route handlers and controllers
   - Error handling and validation

3. API Documentation
   - OpenAPI/Swagger specification
   - Clear endpoint documentation
   - Parameter descriptions
   - Example requests and responses

4. Security & Authentication
   - Authentication schemes (JWT, OAuth, API keys)
   - Authorization and permission handling
   - CORS and security headers
   - Input validation and sanitization

WORKFLOW:
1. Understand API requirements from user
2. Design endpoint structure
3. Create request/response schemas
4. Implement or review API code
5. Generate comprehensive documentation

GUIDELINES:
- Use industry best practices
- Design for scalability and maintainability
- Include proper error responses
- Document edge cases
- Consider backward compatibility`,

  tools: [
    'read_file',
    'read_many_files',
    'grep',
    'write_file',
    'edit',
    'shell',
    'todo_write',
  ],

  capabilities: [
    'api_design',
    'endpoint_creation',
    'schema_generation',
    'documentation',
    'security_implementation',
    'error_handling',
  ],

  triggerKeywords: [
    'api',
    'endpoint',
    'rest',
    'http',
    'swagger',
    'openapi',
    'authentication',
    'request',
    'response',
    'schema',
    'route',
  ],

  level: 'builtin',
  isBuiltin: true,
};
```

---

## Detection Flow

### How Agent Gets Selected

```
User Input: "Build a REST API for user management"
    ↓
AutoAgentDelegate checks all agents
    ↓
SubagentDetectionService.detectSubagents()
    ↓
For each agent:
  1. Check trigger keywords → 'api' found → +0.5 confidence
  2. Check description similarity → match → +0.4 confidence
  3. Check capabilities match → match → +0.1 confidence
    ↓
api-builder: confidence 0.9 ← HIGHEST
explorer:    confidence 0.3
general:     confidence 0.2
    ↓
api-builder agent selected and executed
```

### Trigger Keyword Matching Rules

- **Case-insensitive:** "API", "api", "Api" all match
- **Substring matching:** "create api" matches keyword "api"
- **Any keyword match:** Only need ONE keyword to match
- **Priority:** Trigger keywords get 0.5 confidence boost (highest)

### Confidence Thresholds

```
Confidence >= 0.5  → High confidence, use agent
Confidence 0.3-0.5 → Medium confidence, consider agent
Confidence < 0.3   → Low confidence, use general-purpose
```

---

## Common Patterns

### Pattern 1: File Analysis Agent
```typescript
tools: ['read_file', 'read_many_files', 'grep', 'glob'],
triggerKeywords: ['analyze', 'extract', 'find', 'search', 'identify'],
```

### Pattern 2: Implementation Agent
```typescript
tools: ['read_file', 'write_file', 'edit', 'shell', 'todo_write'],
triggerKeywords: ['implement', 'create', 'build', 'write', 'generate'],
```

### Pattern 3: Review Agent
```typescript
tools: ['read_file', 'read_many_files', 'grep', 'todo_write'],
triggerKeywords: ['review', 'check', 'audit', 'validate', 'verify'],
```

### Pattern 4: Debugging Agent
```typescript
tools: ['read_file', 'grep', 'shell', 'edit'],
triggerKeywords: ['debug', 'fix', 'error', 'issue', 'problem'],
```

---

## Best Practices

### DO ✅
- Use specific, descriptive keywords
- Include detailed system prompt with examples
- Select only necessary tools
- Add capabilities for better routing
- Document agent purpose in comments
- Use consistent naming (kebab-case)
- Test trigger keywords with realistic tasks

### DON'T ❌
- Don't create generic agents (use general-purpose instead)
- Don't include irrelevant tools
- Don't use single-letter keywords
- Don't overlap keywords with existing agents
- Don't make system prompt too long (max 2000 words)
- Don't include vague descriptions
- Don't skip trigger keywords

---

## Troubleshooting

### Agent Not Triggering

**Problem:** Agent never selected despite matching keywords

**Solutions:**
1. Check if agent is exported in `builtin/index.ts`
2. Verify trigger keywords are lowercase
3. Ensure agent name matches entry in registry
4. Check confidence score: `npm test -- agent-detection.test.ts`
5. Verify keywords are in user's message

### Wrong Agent Selected

**Problem:** Different agent selected instead of your agent

**Solutions:**
1. Add more specific trigger keywords
2. Improve description to be more unique
3. Check if another agent has conflicting keywords
4. Increase relevance of system prompt to task type

### Build Fails

**Problem:** Compilation error after adding agent

**Solutions:**
1. Check TypeScript syntax
2. Verify imports are correct
3. Ensure SubagentConfig type is imported
4. Check for circular imports
5. Run `npm run build` with verbose mode

---

## Integration with Prompts

Your agent works with the system prompt system:

```
User Request
    ↓
Auto-delegation detects agent
    ↓
Load core system prompt (base-prompt.ts)
    ↓
Combine with agent system prompt
    ↓
Add user memory if available
    ↓
Add context triggers (IDE context, etc.)
    ↓
Send to LLM
```

Your agent's system prompt is merged with core prompt, not replacing it.

---

## Example Usage

### User Perspective

```
User: "I need to build a REST API for a product catalog"

System detection:
- Matches keyword: 'api'
- Matches description: 'API' and 'implementation'
- Confidence: 0.8 (highest)

Result: api-builder agent selected and delegated

Agent executes with:
- Access to: read_file, write_file, edit, shell
- Extra guidance: API design best practices
- Tools: write API code, generate docs, implement auth
```

### Developer Perspective

```typescript
// In CLI or SDK
await client.sendMessage("Build a REST API for user management");

// System automatically:
// 1. Detects 'api' keyword
// 2. Selects api-builder agent (confidence 0.8)
// 3. Delegates with api-builder system prompt
// 4. Returns API implementation and documentation
```

---

## Reference

### Agent Config Type Definition

```typescript
interface SubagentConfig {
  // Unique identifier
  name: string;

  // Human-readable description
  description: string;

  // System prompt
  systemPrompt: string;

  // Available tools
  tools: ToolName[];

  // Trigger keywords (optional)
  triggerKeywords?: string[];

  // Capabilities (optional)
  capabilities?: string[];

  // Agent level
  level: 'builtin' | 'project' | 'user' | 'session';

  // Is builtin flag (optional)
  isBuiltin?: boolean;

  // File path (optional, system-managed)
  filePath?: string;
}
```

### Available Tool Names

```typescript
type ToolName =
  | 'read_file'        // Read single file
  | 'read_many_files'  // Read multiple files
  | 'write_file'       // Create/overwrite file
  | 'edit'             // Replace text in file
  | 'grep'             // Search with regex
  | 'glob'             // Find files by pattern
  | 'shell'            // Execute commands
  | 'todo_write'       // Track tasks
  | 'task'             // Delegate to agents
  | 'skill'            // Use custom skills
  | 'ls'               // List directory
  | 'web_fetch'        // Fetch web content
  | 'web_search';      // Search the web
```

---

## Next Steps

1. ✅ Create agent file in `builtin/` folder
2. ✅ Define agent configuration (name, description, tools, keywords)
3. ✅ Write detailed system prompt
4. ✅ Export in `builtin/index.ts`
5. ✅ Run `npm run build`
6. ✅ Test with actual user requests
7. ✅ Refine trigger keywords based on results
8. ✅ Document agent purpose in code comments

**Questions?** Check existing agents in `builtin/` folder for examples!
