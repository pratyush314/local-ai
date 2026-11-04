import { Injectable, Logger } from '@nestjs/common';

import {
  extractProjectMemoriesSchema,
  type ExtractedProjectMemory,
} from '@local-ai/contracts/project-memory';

import { CHAT_ROLES } from '@local-ai/constants/chat';

import { LlmService } from '../../llm/llm.service.js';
import { MemoryService } from './memory.service.js';
import { EXTRACT_SYSTEM_PROMPT } from '../constants/system-prompts.constants.js';

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
            content: EXTRACT_SYSTEM_PROMPT,
          },
          {
            role: CHAT_ROLES.USER,

            content: [
              '<user_message>',
              input.userMessage,
              '</user_message>',
              '',
              '<assistant_response>',
              input.assistantResponse,
              '</assistant_response>',
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

      const invalidMemories = result.data.memories.filter(
        (memory) => !this.hasValidEvidence(memory, input.userMessage),
      );

      for (const memory of invalidMemories) {
        this.logger.warn({
          event: 'project_memory_invalid_evidence',
          subject: memory.subject,
          evidence: memory.evidence,
        });
      }

      const evidenceValidatedMemories = result.data.memories.filter((memory) =>
        this.hasValidEvidence(memory, input.userMessage),
      );

      const memories = this.deduplicate(evidenceValidatedMemories);

      let persistedCount = 0;
      let duplicateCount = 0;
      const invalidEvidenceCount = invalidMemories.length;
      let failedCount = 0;

      for (const memory of memories) {
        if (input.signal?.aborted) {
          return;
        }

        try {
          const duplicate = await this.memoryService.findDuplicateMemory({
            projectId: input.projectId,
            kind: memory.kind,
            subject: memory.subject,
            content: memory.content,
          });

          if (duplicate) {
            duplicateCount += 1;

            this.logger.debug({
              event: 'project_memory_duplicate_skipped',
              projectId: input.projectId,
              subject: memory.subject,
              existingMemoryId: duplicate.memory.id,
              similarity: duplicate.similarity,
            });

            continue;
          }

          await this.memoryService.createMemory({
            projectId: input.projectId,
            kind: memory.kind,
            subject: memory.subject,
            content: memory.content,
            evidence: memory.evidence,
            confidence: memory.confidence,
            sourceType: 'message',
            sourceMessageId: input.userMessageId,
          });

          persistedCount += 1;
        } catch (error) {
          failedCount += 1;

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
        evidenceValidatedCount: evidenceValidatedMemories.length,
        invalidEvidenceCount,
        candidateCount: memories.length,
        persistedCount,
        duplicateCount,
        failedCount,
      });
    } catch (error) {
      this.logger.warn(
        `Project memory extraction failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private hasValidEvidence(
    memory: ExtractedProjectMemory,
    userMessage: string,
  ): boolean {
    const normalize = (value: string) =>
      value
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^["'`]+|["'`]+$/g, '');

    const normalizedMessage = normalize(userMessage);

    const normalizedEvidence = normalize(
      memory.evidence.replace(/^user message:\s*/i, ''),
    );

    if (!normalizedEvidence) {
      return false;
    }

    return normalizedMessage.includes(normalizedEvidence);
  }

  private extractJson(raw: string): string | null {
    const text = raw.trim();

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
