import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ProjectMemoryStatus } from '@local-ai/constants';

import { ConversationsService } from '../../conversations/conversations.service.js';
import { MessagesService } from '../../messages/messages.service.js';
import { ProjectsService } from '../../projects/projects.service.js';
import { MemoryRepository } from '../memory.repository.js';
import {
  CreateMemoryInput,
  RetrievedProjectMemory,
} from '../types/memory.types.js';
import {
  isValidMemoryKind,
  isValidMemoryStatus,
  isValidSourceType,
} from '../validations/memory.validations.js';
import { scoreMemory, tokenize } from '../utils/memory.utils.js';

@Injectable()
export class MemoryService {
  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly projectsService: ProjectsService,
    private readonly messagesService: MessagesService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async createMemory(input: CreateMemoryInput) {
    const subject = input.subject.trim();
    const content = input.content.trim();

    if (!subject) {
      throw new BadRequestException('Memory subject cannot be empty');
    }

    if (!content) {
      throw new BadRequestException('Memory content cannot be empty');
    }

    if (!isValidMemoryKind(input.kind)) {
      throw new BadRequestException('Invalid project memory kind');
    }

    if (!isValidSourceType(input.sourceType)) {
      throw new BadRequestException('Invalid project memory source type');
    }

    if (
      input.confidence != null &&
      (!Number.isFinite(input.confidence) ||
        input.confidence < 0 ||
        input.confidence > 1)
    ) {
      throw new BadRequestException(
        'Memory confidence must be between 0 and 1',
      );
    }

    // Ensure the target project exists.
    await this.projectsService.getProject(input.projectId);

    // Validate a source message when one is provided.
    if (input.sourceMessageId) {
      const sourceMessage = await this.messagesService.findById(
        input.sourceMessageId,
      );

      if (!sourceMessage) {
        throw new NotFoundException('Source message not found');
      }

      const sourceConversation =
        await this.conversationsService.getConversation(
          sourceMessage.conversationId,
        );

      if (sourceConversation.projectId !== input.projectId) {
        throw new BadRequestException(
          'Source message must belong to a conversation associated with this project',
        );
      }
    }

    // A message source must include a message reference.
    if (input.sourceType === 'message' && !input.sourceMessageId) {
      throw new BadRequestException(
        'A source message ID is required for message-based memories',
      );
    }

    // Supersede older active decisions for the same subject.
    if (input.kind === 'decision') {
      const activeMemories = await this.memoryRepository.findActiveByProject(
        input.projectId,
      );

      const normalizedSubject = subject.toLocaleLowerCase();

      for (const memory of activeMemories) {
        if (
          memory.kind === 'decision' &&
          memory.subject.trim().toLocaleLowerCase() === normalizedSubject
        ) {
          await this.memoryRepository.updateStatus(memory.id, 'superseded');
        }
      }
    }

    return this.memoryRepository.create({
      id: crypto.randomUUID(),
      projectId: input.projectId,
      kind: input.kind,
      subject,
      content,
      status: 'active',
      confidence: input.confidence ?? null,
      sourceType: input.sourceType,
      sourceMessageId: input.sourceMessageId ?? null,
      sourcePath: input.sourcePath?.trim() || null,
      sourceReference: input.sourceReference?.trim() || null,
    });
  }

  async getMemory(id: string) {
    const memory = await this.memoryRepository.findById(id);

    if (!memory) {
      throw new NotFoundException('Project memory not found');
    }

    return memory;
  }

  async getProjectMemories(projectId: string) {
    await this.projectsService.getProject(projectId);

    return this.memoryRepository.findActiveByProject(projectId);
  }

  async updateMemoryStatus(id: string, status: ProjectMemoryStatus) {
    if (!isValidMemoryStatus(status)) {
      throw new BadRequestException('Invalid project memory status');
    }

    await this.getMemory(id);

    const updated = await this.memoryRepository.updateStatus(id, status);

    if (!updated) {
      throw new NotFoundException('Project memory not found');
    }

    return updated;
  }

  async retrieveRelevantMemories(
    projectId: string,
    query: string,
    limit = 8,
  ): Promise<RetrievedProjectMemory[]> {
    await this.projectsService.getProject(projectId);

    const queryTokens = tokenize(query);

    if (queryTokens.size === 0) {
      return [];
    }

    const memories = await this.memoryRepository.findActiveByProject(projectId);

    return (
      memories
        .map((memory) => ({
          id: memory.id,
          kind: memory.kind,
          subject: memory.subject,
          content: memory.content,
          confidence: memory.confidence,
          sourceType: memory.sourceType,
          sourcePath: memory.sourcePath,
          sourceReference: memory.sourceReference,
          score: scoreMemory(queryTokens, memory),
        }))
        // Require a meaningful match rather than returning any shared word.
        .filter((memory) => memory.score >= 0.15)
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(0, Math.min(limit, 20)))
    );
  }
}
