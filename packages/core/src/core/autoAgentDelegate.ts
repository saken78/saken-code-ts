import type { Config } from '../config/config.js';
import { SubagentDetectionService } from '../subagents/subagent-detection-service.js';
import type { PartListUnion } from '@google/genai';

export class AutoAgentDelegate {
  private detectionService: SubagentDetectionService;

  constructor(private config: Config) {
    this.detectionService = new SubagentDetectionService(config.getSubagentManager());
  }

  async shouldAutoDelegate(request: PartListUnion): Promise<boolean> {
    const requestText = this.extractTextFromParts(request);
    const bestMatch = await this.detectionService.shouldUseSubagent(requestText, 0.3); // Lower threshold
    return bestMatch !== null;
  }

  async executeAutoDelegation(request: PartListUnion, signal: AbortSignal) {
    const requestText = this.extractTextFromParts(request);
    try {
      const bestMatch = await this.detectionService.shouldUseSubagent(requestText, 0.3);

      if (bestMatch) {
        // Use the globally registered TaskTool from the tool registry instead of creating a new instance
        const toolRegistry = this.config.getToolRegistry();
        const taskTool = toolRegistry.getTool('task');

        if (!taskTool) {
          throw new Error('Task tool not found in registry');
        }

        const params = {
          description: `Auto-delegated task: ${requestText.substring(0, 50)}...`,
          prompt: requestText,
          subagent_type: bestMatch.name
        };

        // Execute directly through the method buildAndExecute from DeclarativeTool
        const result = await taskTool.buildAndExecute(params, signal);
        return result;
      }
    } catch (error) {
      console.error('[AutoAgentDelegate] Error during delegation:', error);
      // If there's an error during delegation, return null so normal processing continues
      return null;
    }

    return null;
  }

  private extractTextFromParts(parts: PartListUnion): string {
    if (typeof parts === 'string') {
      return parts;
    }

    if (Array.isArray(parts)) {
      return parts
        .map(part => typeof part === 'string' ? part : part.text || '')
        .join(' ');
    }

    return parts.text || '';
  }
}