import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PROJECT_MEMORY_KINDS,
  PROJECT_MEMORY_SOURCE_TYPES,
  PROJECT_MEMORY_STATUSES,
} from '@local-ai/constants';

import type {
  ProjectMemoryKind,
  ProjectMemorySourceType,
  ProjectMemoryStatus,
} from '@local-ai/constants';

import { ProjectsService } from '../projects/projects.service.js';
import { MessagesService } from '../messages/messages.service.js';
import { MemoryRepository } from './memory.repository.js';

const isValidMemoryKind = (value: string): value is ProjectMemoryKind =>
  (PROJECT_MEMORY_KINDS as readonly string[]).includes(value);

const isValidSourceType = (value: string): value is ProjectMemorySourceType =>
  (PROJECT_MEMORY_SOURCE_TYPES as readonly string[]).includes(value);

const isValidMemoryStatus = (value: string): value is ProjectMemoryStatus =>
  (PROJECT_MEMORY_STATUSES as readonly string[]).includes(value);

export interface CreateMemoryInput {
  projectId: string;
  kind: ProjectMemoryKind;
  subject: string;
  content: string;
  sourceType: ProjectMemorySourceType;
  sourceMessageId?: string | null;
  sourcePath?: string | null;
  sourceReference?: string | null;
  confidence?: number | null;
}

@Injectable()
export class MemoryService {
  constructor(
    private readonly memoryRepository: MemoryRepository,
    private readonly projectsService: ProjectsService,
    private readonly messagesService: MessagesService,
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

      // A message from another conversation/project must not be
      // accepted as evidence for this project's memory.
      if (sourceMessage.conversationId == null) {
        throw new BadRequestException(
          'Source message is not associated with a conversation',
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
}
