/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

/**
 * Loads Claude Code system prompts from the claude-code-system-prompts directory
 * and registers them with the PromptRegistry
 */
export async function loadClaudePrompts(promptRegistry) {
  const claudePromptsDir = path.join(process.cwd(), 'claude-code-system-prompts', 'system-prompts');
  
  // Check if Claude prompts directory exists relative to current working directory
  if (!fs.existsSync(claudePromptsDir)) {
    // Try to find it in the project structure
    const possiblePaths = [
      path.join(process.cwd(), 'claude-code-system-prompts', 'system-prompts'),
      path.join(process.cwd(), '..', 'claude-code-system-prompts', 'system-prompts'),
      path.join(process.cwd(), '..', '..', 'claude-code-system-prompts', 'system-prompts'),
      // If running from within qwen-code project
      path.join(process.cwd(), 'claude-code-system-prompts', 'system-prompts'),
    ];
    
    let foundPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        foundPath = testPath;
        break;
      }
    }
    
    if (!foundPath) {
      console.warn('Claude Code system prompts directory not found, skipping load');
      return;
    }
    
    return loadPromptsFromDirectory(promptRegistry, foundPath);
  }
  
  return loadPromptsFromDirectory(promptRegistry, claudePromptsDir);
}

/**
 * Loads prompts from a given directory
 */
async function loadPromptsFromDirectory(promptRegistry, directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    console.warn(`Directory does not exist: ${directoryPath}`);
    return;
  }

  // Find all markdown files in the directory
  const mdFiles = glob.sync('**/*.md', {
    cwd: directoryPath,
    absolute: true
  });

  for (const filePath of mdFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath, '.md');
      
      // Extract prompt name and description from file content if available
      const promptName = extractPromptName(content, fileName);
      const promptDescription = extractPromptDescription(content);
      
      // Create a prompt object compatible with the registry
      const prompt = {
        name: promptName,
        description: promptDescription,
        content: content,
        serverName: 'claude-code-system-prompts', // Group all Claude prompts under this server name
        filePath: filePath,
        type: 'claude-prompt'
      };
      
      // Register the prompt
      promptRegistry.registerPrompt(prompt);
    } catch (error) {
      console.warn(`Error loading prompt from ${filePath}:`, error.message);
    }
  }
  
  console.log(`Loaded ${mdFiles.length} Claude Code system prompts into registry`);
}

/**
 * Extracts prompt name from content or filename
 */
function extractPromptName(content, fileName) {
  // Look for name in comment at the beginning of file
  const nameMatch = content.match(/name:\s*'([^']+)'/);
  if (nameMatch) {
    return nameMatch[1];
  }
  
  // Use filename if no name found in content
  return fileName.replace(/[-_]/g, ' ');
}

/**
 * Extracts prompt description from content
 */
function extractPromptDescription(content) {
  // Look for description in comment at the beginning of file
  const descMatch = content.match(/description:\s*'([^']+)'/);
  if (descMatch) {
    return descMatch[1];
  }
  
  // Return first few lines as description if no explicit description found
  const lines = content.split('\n').slice(0, 5);
  return lines.join(' ').substring(0, 100) + '...';
}