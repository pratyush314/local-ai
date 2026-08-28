import { Injectable, NotFoundException } from '@nestjs/common';

import { ConversationsRepository } from './conversations.repository';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly conversationsRepository: ConversationsRepository,
  ) {}

  async createConversation(title = 'New Chat') {
    return this.conversationsRepository.createConversation({
      id: crypto.randomUUID(),
      title,
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
}
