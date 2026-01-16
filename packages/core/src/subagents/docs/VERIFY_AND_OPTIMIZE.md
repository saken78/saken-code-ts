# Agent Triggering: Verification & Optimization Guide

> Complete guide to verify agent auto-triggering works and optimize trigger keywords for your needs

---

## **PART 1: VERIFY AGENT TRIGGERING** ✅

### **How Agent Triggering Works**

When you send a message, the system:

```
Your Message
    ↓
AutoAgentDelegate checks if message should auto-delegate
    ↓
SubagentDetectionService analyzes message
    ↓
Check PRIORITY 1: Trigger keywords match?
    - If YES → Boost confidence by +0.5
    ↓
Check PRIORITY 2: Description similarity?
    - If YES → Add +0.4 confidence
    ↓
Check PRIORITY 3: System prompt relevance?
    - If YES → Add +0.3 confidence
    ↓
Get agent with HIGHEST confidence
    ↓
If confidence >= 0.3 → Auto-delegate
If confidence < 0.3 → Use general-purpose agent
```

---

### **1. Verify Each Agent Triggers Correctly**

#### **Test Explorer Agent**

**Setup:**
```bash
cd /home/saken/qwen/qwen-code
```

**Test Case 1: Trigger with keyword**
```
User: "Please explore the src directory and find all TypeScript files"

Expected: explorer agent selected
Why: Contains keywords 'explore' and 'find'
Confidence: 0.5+ (trigger keyword match)
```

**Test Case 2: Trigger with different keyword**
```
User: "Navigate the project structure and show me the architecture"

Expected: explorer agent selected
Why: Contains keyword 'navigate'
Confidence: 0.5+ (trigger keyword match)
```

**Test Case 3: Trigger with search keyword**
```
User: "Search for all functions that handle errors"

Expected: explorer agent selected
Why: Contains keyword 'search'
Confidence: 0.5+ (trigger keyword match)
```

---

#### **Test Planner Agent**

**Test Case 1: Trigger with keyword**
```
User: "Help me plan the implementation of the new feature"

Expected: planner agent selected
Why: Contains keyword 'plan'
Confidence: 0.5+ (trigger keyword match)
```

**Test Case 2: Alternative keyword**
```
User: "I need you to break down this complex task into smaller steps"

Expected: planner agent selected
Why: Contains keyword 'break down'
Confidence: 0.5+ (trigger keyword match)
```

**Test Case 3: Organize keyword**
```
User: "Can you organize the implementation steps for this feature?"

Expected: planner agent selected
Why: Contains keyword 'organize'
Confidence: 0.5+ (trigger keyword match)
```

---

#### **Test Debugger Agent**

**Test Case 1: Trigger with keyword**
```
User: "Debug this error that keeps occurring in the build system"

Expected: debugger agent selected
Why: Contains keywords 'debug' and 'error'
Confidence: 0.5+ (trigger keyword match)
```

**Test Case 2: Fix keyword**
```
User: "Help me fix this TypeScript compilation issue"

Expected: debugger agent selected
Why: Contains keyword 'fix'
Confidence: 0.5+ (trigger keyword match)
```

**Test Case 3: Bug keyword**
```
User: "There's a bug in the authentication flow, can you investigate?"

Expected: debugger agent selected
Why: Contains keyword 'bug'
Confidence: 0.5+ (trigger keyword match)
```

---

#### **Test Reviewer Agent**

**Test Case 1: Trigger with keyword**
```
User: "Review this code for security issues and best practices"

Expected: reviewer agent selected
Why: Contains keyword 'review'
Confidence: 0.5+ (trigger keyword match)
```

**Test Case 2: Audit keyword**
```
User: "Please audit the API endpoints for vulnerabilities"

Expected: reviewer agent selected
Why: Contains keyword 'audit'
Confidence: 0.5+ (trigger keyword match)
```

**Test Case 3: Check keyword**
```
User: "Check this component for performance issues"

Expected: reviewer agent selected
Why: Contains keyword 'check'
Confidence: 0.5+ (trigger keyword match)
```

---

#### **Test Content Analyzer Agent**

**Test Case 1: Trigger with keyword**
```
User: "Analyze the API specification and extract all endpoints"

Expected: content-analyzer agent selected
Why: Contains keywords 'analyze' and 'extract'
Confidence: 0.5+ (trigger keyword match)
```

**Test Case 2: Summarize keyword**
```
User: "Please summarize the main points from the documentation"

Expected: content-analyzer agent selected
Why: Contains keyword 'summarize'
Confidence: 0.5+ (trigger keyword match)
```

**Test Case 3: Requirement keyword**
```
User: "List all the system requirements from this spec document"

Expected: content-analyzer agent selected
Why: Contains keyword 'requirement'
Confidence: 0.5+ (trigger keyword match)
```

---

### **2. Verify Fallback Works**

**Test Case: No trigger keywords matched**
```
User: "Hello, how are you?"

Expected: general-purpose agent selected (or normal chat)
Why: No agent trigger keywords found
Confidence: < 0.3
```

---

### **3. Verify Multiple Keywords**

**Test Case: Multiple agents have matching keywords**
```
User: "Explore the codebase and debug any issues you find"

Expected: One agent selected (likely explorer or debugger)
Why: Both have trigger keywords
Behavior: System picks agent with HIGHEST confidence
```

**Test Case: Ambiguous keyword**
```
User: "Find and analyze the performance bottlenecks"

Expected: Could be explorer OR content-analyzer
Why: Both have 'find' and 'analyze' keywords
Behavior: System picks agent with highest total confidence
```

---

## **PART 2: OPTIMIZE TRIGGER KEYWORDS** 🎯

### **Current Trigger Keywords by Agent**

```typescript
// Explorer Agent
triggerKeywords: ['explore', 'find', 'search', 'navigate', 'structure',
                  'architecture', 'locate', 'where is']

// Planner Agent
triggerKeywords: ['plan', 'organize', 'break down', 'schedule', 'outline',
                  'structure', 'organize', 'arrange']

// Reviewer Agent
triggerKeywords: ['review', 'check', 'audit', 'security', 'quality',
                  'best practice', 'improve', 'feedback']

// Debugger Agent
triggerKeywords: ['debug', 'fix', 'error', 'issue', 'problem',
                  'troubleshoot', 'crash', 'exception', 'bug']

// Content Analyzer Agent
triggerKeywords: ['analyze', 'summarize', 'extract', 'find', 'what are',
                  'document', 'content', 'specification', 'requirement',
                  'endpoint', 'parameter', 'explain', 'understand', 'compare']
```

---

### **Optimization Strategy**

#### **1. Remove Overlapping Keywords**

**Problem:** Keywords that appear in multiple agents cause confusion.

**Example:** 'find' appears in both explorer and content-analyzer
```
explorer:          'find'
content-analyzer:  'find'
```

**Solution:** Make keywords more specific
```
explorer:          'find files' or 'locate' (more specific)
content-analyzer:  'find information' or just 'extract' (more specific)
```

---

#### **2. Add Context-Specific Keywords**

**Problem:** Generic keywords like 'analyze' don't clearly indicate which agent.

**Current:** content-analyzer has 'analyze'
```
User: "Analyze the code quality"
→ Ambiguous: Could be content-analyzer or reviewer
```

**Solution:** Add context that distinguishes the agent
```
Content-analyzer specific keywords:
- 'analyze document'
- 'analyze text'
- 'analyze spec'
- 'extract from document'

Reviewer specific keywords:
- 'analyze code'
- 'analyze performance'
- 'analyze security'
- 'review code quality'
```

---

#### **3. Add Action-Oriented Keywords**

**Problem:** Passive keywords don't trigger as often.

**Example:** Planner agent doesn't trigger on "I need steps for..."
```
Current keywords: ['plan', 'organize', 'break down', ...]
Missing keyword: 'steps' or 'how to'
```

**Solution:** Add action-oriented keywords
```
Add to Planner:
- 'how to'
- 'what steps'
- 'create plan'
- 'design approach'
```

---

#### **4. Remove Duplicate Keywords**

**Problem:** Some keywords appear multiple times.

**Example:** Planner agent has both 'structure' and 'organize'
```
planner: ['...', 'structure', 'organize', '...', 'organize', '...']
                                               ^^^ DUPLICATE!
```

**Solution:** Keep only one instance
```
planner: ['plan', 'organize', 'break down', 'schedule', 'outline', 'arrange']
```

---

### **How to Optimize Your Keywords**

#### **Step 1: Identify Your Usage Patterns**

Track actual messages that should trigger each agent:

```markdown
## Messages that SHOULD trigger explorer:
- "Find the bug in the API routes"
- "Show me the structure of the src directory"
- "Where is the authentication handler?"
- "Explore how this library is structured"

## Messages that SHOULD trigger planner:
- "Create a development plan for this feature"
- "How do we approach this migration?"
- "Break down the implementation steps"
- "Design the implementation strategy"

## Messages that SHOULD trigger debugger:
- "This keeps crashing on startup"
- "Why is the build failing?"
- "There's a bug with async handling"
- "Fix the infinite loop in the scheduler"

## Messages that SHOULD trigger content-analyzer:
- "Extract all API endpoints from the spec"
- "What are the system requirements?"
- "Summarize the main points of this doc"
- "Compare these two specifications"

## Messages that SHOULD trigger reviewer:
- "Check this code for vulnerabilities"
- "Review this for performance issues"
- "Is this following best practices?"
- "Audit the security of this implementation"
```

---

#### **Step 2: Test Current Keywords**

For each category, run through your actual messages:

```
Message: "Find the bug in the API routes"
Expected: explorer agent
Current keywords: ['explore', 'find', 'search', ...]
Match: 'find' ✓ TRIGGERS
Confidence: 0.5 (trigger keyword) ✓ GOOD
```

```
Message: "Why is the build failing?"
Expected: debugger agent
Current keywords: ['debug', 'fix', 'error', 'issue', ...]
Match: None ✗ DOESN'T TRIGGER
Confidence: 0 (no keyword match)
Problem: Need to add 'why' or 'failing' keyword
```

---

#### **Step 3: Identify Missing Keywords**

Messages that SHOULD trigger but don't:

```
❌ "Explore the project" → Should trigger explorer
   Missing keywords that would help: 'show me', 'look at'

❌ "Create steps for this feature" → Should trigger planner
   Missing keywords: 'steps', 'how to', 'approach'

❌ "There's an issue with login" → Should trigger debugger
   Missing keywords: 'issue' is there, but also 'something's wrong'

❌ "Tell me about the API" → Should trigger content-analyzer
   Missing keywords: 'tell me' patterns, 'describe', 'explain' exists but could be stronger

❌ "Is this code good?" → Should trigger reviewer
   Missing keywords: 'good', 'quality', 'production-ready'
```

---

#### **Step 4: Add New Keywords (Carefully)**

**For Explorer Agent:**
```typescript
// Current
triggerKeywords: ['explore', 'find', 'search', 'navigate', 'structure',
                  'architecture', 'locate', 'where is']

// Add (if needed)
triggerKeywords: ['explore', 'find', 'search', 'navigate', 'structure',
                  'architecture', 'locate', 'where is',
                  'show me',      // "Show me the structure"
                  'look at',      // "Look at the src directory"
                  'files']        // "Find all TypeScript files"
```

**For Planner Agent:**
```typescript
// Current
triggerKeywords: ['plan', 'organize', 'break down', 'schedule', 'outline',
                  'structure', 'organize', 'arrange']

// Issues:
// - 'structure' overlaps with explorer
// - Missing action-oriented keywords

// Fixed:
triggerKeywords: ['plan', 'organize', 'break down', 'schedule', 'outline',
                  'arrange',
                  'approach',     // "What's the best approach?"
                  'strategy',     // "Design strategy for implementation"
                  'steps',        // "What steps should I follow?"
                  'how to',       // "How to implement this?"
                  'implementation'] // "Implementation plan"
```

**For Debugger Agent:**
```typescript
// Current
triggerKeywords: ['debug', 'fix', 'error', 'issue', 'problem',
                  'troubleshoot', 'crash', 'exception', 'bug']

// Add:
triggerKeywords: ['debug', 'fix', 'error', 'issue', 'problem',
                  'troubleshoot', 'crash', 'exception', 'bug',
                  'why',          // "Why is this failing?"
                  'broken',       // "This is broken"
                  'not working',  // "This isn't working"
                  'failing']      // "Build is failing"
```

**For Content Analyzer Agent:**
```typescript
// Current
triggerKeywords: ['analyze', 'summarize', 'extract', 'find', 'what are',
                  'document', 'content', 'specification', 'requirement',
                  'endpoint', 'parameter', 'explain', 'understand', 'compare']

// Problem: 'find' overlaps heavily with explorer
// Solution: Make it more document-specific

// Fixed:
triggerKeywords: ['analyze', 'summarize', 'extract', 'document',
                  'specification', 'requirement', 'endpoint', 'parameter',
                  'explain', 'understand', 'compare',
                  'what does',    // "What does the API do?"
                  'tell me about',// "Tell me about requirements"
                  'parse',        // "Parse this JSON"
                  'from file']    // "Extract info from this file"
```

**For Reviewer Agent:**
```typescript
// Current
triggerKeywords: ['review', 'check', 'audit', 'security', 'quality',
                  'best practice', 'improve', 'feedback']

// Add:
triggerKeywords: ['review', 'check', 'audit', 'security', 'quality',
                  'best practice', 'improve', 'feedback',
                  'good code',    // "Is this good code?"
                  'production-ready', // "Is this production ready?"
                  'standards',    // "Does this follow standards?"
                  'evaluate']     // "Evaluate this implementation"
```

---

### **5. Test Optimized Keywords**

After updating keywords, test again:

```bash
cd /home/saken/qwen/qwen-code
npm test -- agent-detection.test.ts
```

Then test with real messages:

```
Message: "Why is the build failing?"
Expected: debugger agent
New keywords: ['debug', 'fix', 'error', 'issue', 'problem', 'troubleshoot',
               'crash', 'exception', 'bug', 'why', 'broken', 'not working', 'failing']
Match: 'why' ✓ TRIGGERS
Match: 'failing' ✓ TRIGGERS
Confidence: 0.5+ (trigger keyword) ✓ GOOD
```

---

## **Optimization Checklist**

```
Trigger Keywords Optimization:
  ☐ Identify overlapping keywords between agents
  ☐ Collect 20+ real user messages for each agent
  ☐ Test which messages trigger current keywords
  ☐ Identify messages that SHOULD but DON'T trigger
  ☐ Identify keywords that trigger WRONG agent
  ☐ Add specific, context-rich keywords
  ☐ Remove ambiguous keywords
  ☐ Test optimized keywords with unit tests
  ☐ Document your keyword strategy
  ☐ Train team on when each agent triggers

Verification:
  ☐ Test each agent with multiple trigger keywords
  ☐ Verify general-purpose fallback works
  ☐ Test with ambiguous inputs
  ☐ Verify confidence scoring is correct
  ☐ Test edge cases (empty input, very long text)
  ☐ Document test results
  ☐ Set up monitoring for agent selection
```

---

## **Files to Modify for Optimization**

When you're ready to optimize keywords:

```typescript
// File: /packages/core/src/subagents/builtin/<agent>-agent.ts

export const explorerAgent: SubagentConfig = {
  name: 'explorer',
  // ... other fields ...
  triggerKeywords: [
    // ← UPDATE YOUR KEYWORDS HERE
    'explore',
    'find',
    'search',
    // ADD NEW ONES:
    'show me',
    'look at',
  ],
};
```

Then:
1. Build: `npm run build`
2. Test: `npm test -- agent-detection.test.ts`
3. Commit: Document your optimization in commit message

---

## **Tips for Best Results**

### **DO** ✅
- Use specific, action-oriented keywords
- Test with real user messages
- Document why you chose each keyword
- Include context in keywords ("find files" vs just "find")
- Aim for 10-15 keywords per agent
- Keep keywords lowercase
- Test after each optimization
- Monitor which agents actually get triggered

### **DON'T** ❌
- Use single-letter keywords
- Create keywords that overlap too much
- Make keywords too long (max 3-4 words)
- Add keywords you're not sure about
- Forget to rebuild after changes
- Skip testing after optimization
- Add generic keywords like "help" or "do"

---

## **Next Steps**

1. **Verify:** Run test cases above to verify all agents trigger correctly
2. **Analyze:** Collect real messages your team actually sends
3. **Optimize:** Update trigger keywords in agent files
4. **Test:** Run unit tests and manual verification
5. **Monitor:** Track which agents get selected for which messages
6. **Iterate:** Refine keywords based on real usage patterns

**Good luck! Your optimized agents will make task routing much more effective!** 🎯
