import { Injectable, NotFoundException } from '@nestjs/common';

import type {
  Message,
  NewMessage,
} from '@/common/database/drizzle/schema/messages.schema';

import type { MessageStatus } from '@local-ai/constants/chat';

import { MessagesRepository } from './messages.repository';

@Injectable()
export class MessagesService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  create(data: NewMessage): Promise<Message> {
    return this.messagesRepository.create(data);
  }

  async findById(id: string): Promise<Message> {
    const message = await this.messagesRepository.findById(id);

    if (!message) {
      throw new NotFoundException(`Message with id "${id}" not found`);
    }

    return message;
  }

  findByConversationId(conversationId: string): Promise<Message[]> {
    return this.messagesRepository.findByConversationId(conversationId);
  }

  async update(
    id: string,
    data: {
      content?: string;
      status?: MessageStatus;
    },
  ): Promise<Message> {
    const message = await this.messagesRepository.update(id, data);

    if (!message) {
      throw new NotFoundException(`Message with id "${id}" not found`);
    }

    return message;
  }

  async updateContent(id: string, content: string): Promise<Message> {
    const message = await this.messagesRepository.update(id, {
      content,
    });

    if (!message) {
      throw new NotFoundException(`Message with id "${id}" not found`);
    }

    return message;
  }

  async updateStatus(id: string, status: MessageStatus): Promise<Message> {
    const message = await this.messagesRepository.update(id, {
      status,
    });

    if (!message) {
      throw new NotFoundException(`Message with id "${id}" not found`);
    }

    return message;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);

    await this.messagesRepository.delete(id);
  }
}
