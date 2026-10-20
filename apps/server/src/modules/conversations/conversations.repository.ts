import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import { DatabaseService } from '../../common/database/database.service.js';
import {
  Conversation,
  conversations,
  type NewConversation,
} from '../../common/database/drizzle/schema/index.js';

@Injectable()
export class ConversationsRepository {
  constructor(private readonly database: DatabaseService) {}

  async createConversation(data: NewConversation) {
    const [conversation] = await this.database.db
      .insert(conversations)
      .values(data)
      .returning();

    return conversation;
  }

  async findConversationById(id: string) {
    return this.database.db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });
  }

  async findAllConversations() {
    return this.database.db.query.conversations.findMany({
      orderBy: [desc(conversations.updatedAt)],
    });
  }

  async updateConversationTitle(
    id: string,
    title: string,
  ): Promise<Conversation | undefined> {
    const [conversation] = await this.database.db
      .update(conversations)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, id))
      .returning();

    return conversation;
  }

  async touchConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await this.database.db
      .update(conversations)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, id))
      .returning();

    return conversation;
  }

  async deleteConversation(id: string) {
    await this.database.db
      .delete(conversations)
      .where(eq(conversations.id, id));
  }

  async setProject(conversationId: string, projectId: string | null) {
    const [conversation] = await this.database.db
      .update(conversations)
      .set({
        projectId,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId))
      .returning();

    return conversation;
  }
}
