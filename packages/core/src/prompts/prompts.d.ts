/**
 * Type declarations for loadClaudePrompts module
 */

declare module "./loadClaudePrompts.js" {
  export function loadClaudePrompts(promptRegistry: any): Promise<void>;
}

declare module "./prompt-registry.js" {
  export class PromptRegistry {
    getPromptsByType(type: string): any[];
  }
}