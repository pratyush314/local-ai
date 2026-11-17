import { Injectable, NotFoundException } from '@nestjs/common';

import { ConversationsRepository } from './conversations.repository.js';
import { ProjectsService } from '../projects/projects.service.js';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationsRepository: ConversationsRepository,
    private readonly projectsService: ProjectsService,
  ) {}

  async createConversation(projectId?: string | null) {
    if (projectId) {
      await this.projectsService.getProject(projectId);
    }

    return this.conversationsRepository.createConversation({
      id: crypto.randomUUID(),
      title: 'New Chat',
      projectId: projectId ?? null,
    });
  }

  async getConversation(id: string) {
    const conversation =
      await this.conversationsRepository.findConversationById(id);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async getConversations() {
    return this.conversationsRepository.findAllConversations();
  }

  async getProjectConversations(projectId: string) {
    await this.projectsService.getProject(projectId);

    return this.conversationsRepository.findConversationsByProjectId(projectId);
  }

  async touchConversation(id: string) {
    const conversation =
      await this.conversationsRepository.touchConversation(id);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async updateConversationTitle(id: string, title: string) {
    const conversation =
      await this.conversationsRepository.updateConversationTitle(id, title);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async deleteConversation(id: string) {
    await this.getConversation(id);

    await this.conversationsRepository.deleteConversation(id);
  }

  async assignProject(conversationId: string, projectId: string | null) {
    await this.getConversation(conversationId);

    if (projectId !== null) {
      await this.projectsService.getProject(projectId);
    }

    const conversation = await this.conversationsRepository.setProject(
      conversationId,
      projectId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
