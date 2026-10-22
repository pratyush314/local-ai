import { Injectable, Logger } from '@nestjs/common';

import {
  extractProjectMemoriesSchema,
  type ExtractedProjectMemory,
} from '@local-ai/contracts/project-memory';

import { CHAT_ROLES } from '@local-ai/constants/chat';

import { LlmService } from '../../llm/llm.service.js';
import { MemoryService } from './memory.service.js';

@Injectable()
export class MemoryExtractorService {
  private readonly logger = new Logger(MemoryExtractorService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly memoryService: MemoryService,
  ) {}

  async extractFromExchange(input: {
    projectId: string;
    userMessageId: string;
    userMessage: string;
    assistantResponse: string;
    signal?: AbortSignal;
  }): Promise<void> {
    if (input.signal?.aborted) {
      return;
    }

    try {
      const raw = await this.llmService.generate({
        messages: [
          {
            role: CHAT_ROLES.SYSTEM,
            content: [
              'Extract durable project memories from the conversation exchange.',
              'Return only a JSON object with a "memories" array.',
              'Each item must contain kind, subject, content, and confidence.',
              'Allowed kinds: decision, constraint, fact, task.',
              'Extract at most 5 memories.',
              'Only include explicit, useful information about the project.',
              'Prefer architectural decisions, constraints, confirmed facts, and actionable tasks.',
              'Do not infer facts that were not explicitly stated.',
              'Do not extract generic advice, temporary questions, or unsupported assistant claims.',
              'If nothing durable was established, return {"memories":[]}.',
              'Confidence must be a number from 0 to 1.',
            ].join('\n'),
          },
          {
            role: CHAT_ROLES.USER,
            content: [
              'User message:',
              input.userMessage,
              '',
              'Assistant response:',
              input.assistantResponse,
            ].join('\n'),
          },
        ],
        temperature: 0.1,
        maxTokens: 1536,
        chatTemplateKwargs: {
          enable_thinking: false,
        },
        signal: input.signal,
      });

      if (input.signal?.aborted) {
        return;
      }

      const jsonText = this.extractJson(raw);

      if (!jsonText) {
        this.logger.warn('Memory extraction returned no valid JSON object');
        return;
      }

      let parsedJson: unknown;

      try {
        parsedJson = JSON.parse(jsonText);
      } catch {
        this.logger.warn('Memory extraction returned malformed JSON');
        return;
      }

      const result = extractProjectMemoriesSchema.safeParse(parsedJson);

      if (!result.success) {
        this.logger.warn('Memory extraction output failed schema validation');
        return;
      }

      const memories = this.deduplicate(result.data.memories);

      for (const memory of memories) {
        if (input.signal?.aborted) {
          return;
        }

        try {
          await this.memoryService.createMemory({
            projectId: input.projectId,
            kind: memory.kind,
            subject: memory.subject,
            content: memory.content,
            confidence: memory.confidence,
            sourceType: 'message',
            sourceMessageId: input.userMessageId,
          });
        } catch (error) {
          this.logger.warn(
            `Could not persist extracted memory "${memory.subject}": ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }
      }

      this.logger.debug({
        event: 'project_memory_extraction_completed',
        projectId: input.projectId,
        sourceMessageId: input.userMessageId,
        extractedCount: result.data.memories.length,
        persistedCandidates: memories.length,
      });
    } catch (error) {
      this.logger.warn(
        `Project memory extraction failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private extractJson(raw: string): string | null {
    const text = raw.trim();

    // Prefer a complete JSON object, allowing providers that wrap
    // structured output in a Markdown code fence.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1]?.trim() ?? text;

    if (candidate.startsWith('{') && candidate.endsWith('}')) {
      return candidate;
    }

    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');

    return start >= 0 && end > start ? candidate.slice(start, end + 1) : null;
  }

  private deduplicate(
    memories: ExtractedProjectMemory[],
  ): ExtractedProjectMemory[] {
    const seen = new Set<string>();

    return memories.filter((memory) => {
      const key = `${memory.kind}:${memory.subject.trim().toLocaleLowerCase()}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }
}
