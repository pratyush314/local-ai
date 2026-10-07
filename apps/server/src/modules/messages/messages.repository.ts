import { Injectable } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../../common/database/database.service.js';
import {
  CreateMessage,
  Message,
  messages,
} from '../../common/database/drizzle/index.js';

@Injectable()
export class MessagesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: CreateMessage): Promise<Message> {
    const [message] = await this.databaseService.db
      .insert(messages)
      .values({
        ...data,

        sequence: sql<number>`
          coalesce(
            (
              select max(${messages.sequence})
              from ${messages}
              where ${messages.conversationId} = ${data.conversationId}
            ),
            0
          ) + 1
        `,
      })
      .returning();

    return message;
  }

  async findById(id: string): Promise<Message | undefined> {
    const [message] = await this.databaseService.db
      .select()
      .from(messages)
      .where(eq(messages.id, id));

    return message;
  }

  async findByConversationId(conversationId: string): Promise<Message[]> {
    return this.databaseService.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.sequence));
  }

  async update(
    id: string,
    data: Partial<Pick<Message, 'content' | 'status'>>,
  ): Promise<Message | undefined> {
    const [message] = await this.databaseService.db
      .update(messages)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, id))
      .returning();

    return message;
  }

  async delete(id: string): Promise<void> {
    await this.databaseService.db.delete(messages).where(eq(messages.id, id));
  }
}
