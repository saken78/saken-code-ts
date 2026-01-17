/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 *
 * Content Analyzer Agent
 *
 * A specialized agent for analyzing document content, extracting key information,
 * and summarizing large text blocks. This is an example of a custom builtin agent.
 *
 * USAGE:
 * User: "Analyze this documentation and summarize the main points"
 * → Triggers: content-analyzer agent
 *
 * User: "Extract the API endpoints from this spec file"
 * → Triggers: content-analyzer agent
 *
 * User: "Find the requirements section in this document"
 * → Triggers: content-analyzer agent
 */

import type { SubagentConfig } from '../types.js';

/**
 * Content Analyzer Agent Configuration
 *
 * This agent specializes in:
 * - Reading and analyzing file contents
 * - Extracting specific information from documents
 * - Summarizing lengthy text
 * - Identifying key sections and patterns
 * - Comparing multiple documents
 */
export const contentAnalyzerAgent: SubagentConfig = {
  // REQUIRED: Agent identifier
  name: 'content-analyzer',

  // REQUIRED: Human-readable description (used for UI and similarity matching)
  description:
    'Specialized agent for analyzing document content, extracting key information, and summarizing text. Excellent for understanding complex documentation, API specifications, configuration files, and identifying patterns across documents.',

  // REQUIRED: System prompt that defines agent behavior and expertise
  // This is injected before user prompt when this agent is selected
  systemPrompt: `You are a Content Analysis Specialist. Your expertise lies in:

CORE COMPETENCIES:
1. Document Analysis
   - Read and understand complex documents
   - Identify main sections and structure
   - Extract key information accurately
   - Maintain context across long documents

2. Information Extraction
   - Find specific data points from documents
   - List items, endpoints, parameters, requirements
   - Map relationships between sections
   - Organize information into clear formats

3. Summarization
   - Create concise summaries of lengthy content
   - Highlight critical points
   - Preserve important details
   - Provide actionable insights

4. Pattern Recognition
   - Identify recurring patterns in documents
   - Find inconsistencies or gaps
   - Recognize structures and templates
   - Spot important keywords and markers

WORKFLOW:
1. Start by understanding what the user wants to extract or analyze
2. Read the relevant files using available tools
3. Carefully analyze the content for the requested information
4. Present findings in a clear, organized format
5. Provide context and explanations where helpful

GUIDELINES:
- Always reference specific file names and line numbers when citing information
- Use bullet points or structured formats for extracted data
- Ask clarifying questions if the request is ambiguous
- If information spans multiple files, indicate file boundaries clearly
- Be thorough but concise in your analysis
- Use your full context window to understand complex documents

TOOLS AVAILABLE:
- read_file: Read entire file contents
- read_many_files: Read multiple files efficiently
- grep_search: Search for specific patterns in files
- glob: Find files matching patterns

EXAMPLE OUTPUTS:
For API extraction: List endpoints with methods, paths, parameters
For requirements: Numbered list of key requirements with file references
For summaries: Executive summary followed by detailed breakdown`,

  // REQUIRED: Tools this agent can use
  // Only these tools will be available in the agent's execution context
  tools: [
    'read_file', // For reading single files
    'read_many_files', // For reading multiple files at once
    'grep_search', // For searching patterns
    'fd', // For finding files by pattern
    'todo_write', // For tracking analysis tasks
  ],

  // OPTIONAL: Capabilities this agent has (metadata for routing decisions)
  // Used by auto-delegation logic to understand what this agent can do
  capabilities: [
    'document_analysis',
    'information_extraction',
    'summarization',
    'pattern_recognition',
    'content_mapping',
    'requirement_identification',
    'yaml_analysis',
    'toml_parsing',
    'xml_handling',
    'json_analysis',
    'config_file_reading',
    'specification_parsing',
    'documentation_analysis',
    'metadata_extraction',
    'endpoint_discovery',
    'api_documentation',
    'content_comparison',
    'structure_analysis',
    'format_parsing',
  ],

  // OPTIONAL: Keywords that trigger this agent
  // When user message contains these keywords, this agent gets higher priority
  // Keywords are checked with PRIORITY 1 in detection service (confidence: 0.5)
  triggerKeywords: [
    'saken-analyzer',
    'analyze', // "Analyze this file"
    'summarize', // "Summarize the documentation"
    'extract', // "Extract the endpoints"
    'find', // "Find the requirements section"
    'what are', // "What are the main points?"
    'document', // "Document this"
    'content', // "Analyze content"
    'specification', // "Read the specification"
    'requirement', // "List the requirements"
    'endpoint', // "Find all endpoints"
    'parameter', // "What parameters are needed?"
    'explain', // "Explain this section"
    'understand', // "Help me understand this"
    'compare', // "Compare these documents"
  ],

  // OPTIONAL: Level of agent (builtin, project, user, or session)
  level: 'builtin',

  // OPTIONAL: Whether this is a built-in agent
  isBuiltin: true,
};

/**
 * INTEGRATION GUIDE: How to use this agent
 *
 * 1. AUTOMATIC DETECTION (via trigger keywords)
 *    User: "Analyze the API specification document"
 *    → System detects 'analyze' keyword
 *    → Automatically selects content-analyzer agent
 *    → Delegates task to agent
 *
 * 2. MANUAL DELEGATION (via task tool)
 *    ```typescript
 *    // User explicitly calls task tool with this agent
 *    /task content-analyzer
 *    Analyze this file and extract key information
 *    ```
 *
 * 3. CUSTOM PROMPT INTEGRATION
 *    The system prompt above will be combined with:
 *    - User memory from ~/.qwen/memory/
 *    - Base system prompt from base-prompt.ts
 *    - Any context triggers (IDE context, file references)
 *
 * 4. TOOL USAGE
 *    When this agent executes, only these tools are available:
 *    - read_file: Read single file
 *    - read_many_files: Read batch of files
 *    - grep: Search for patterns
 *    - glob: Find matching files
 *    - todo_write: Track tasks (for complex analysis)
 *
 * EXAMPLES:
 *
 * Example 1: API Endpoint Extraction
 * User: "Extract all API endpoints from our documentation"
 * Agent will:
 *   1. Read documentation files using glob + read_many_files
 *   2. Search for endpoint patterns using grep
 *   3. Organize results into clear list
 *   4. Provide methods, paths, and parameters
 *
 * Example 2: Requirements Analysis
 * User: "What are the system requirements for this project?"
 * Agent will:
 *   1. Read README.md, requirements.txt, package.json
 *   2. Search for requirement-related keywords
 *   3. Summarize findings in structured format
 *   4. List versions, dependencies, constraints
 *
 * Example 3: Documentation Summary
 * User: "Summarize the main points of this technical spec"
 * Agent will:
 *   1. Read the specification file(s)
 *   2. Identify key sections and topics
 *   3. Extract main points from each section
 *   4. Create executive summary
 */
