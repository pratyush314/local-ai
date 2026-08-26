import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import { DatabaseService } from '@/common/database/database.service';
import {
  conversations,
  type NewConversation,
} from '@/common/database/drizzle/schema';

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

  async deleteConversation(id: string) {
    await this.database.db
      .delete(conversations)
      .where(eq(conversations.id, id));
  }
}
