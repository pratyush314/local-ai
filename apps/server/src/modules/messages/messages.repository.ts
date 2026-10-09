import { Injectable } from '@nestjs/common';
import { and, asc, eq, gt, gte, sql } from 'drizzle-orm';
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

  async deleteFromSequence(
    conversationId: string,
    sequence: number,
  ): Promise<void> {
    await this.databaseService.db
      .delete(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          gte(messages.sequence, sequence),
        ),
      );
  }

  editAndDeleteAfter(
    conversationId: string,
    messageId: string,
    sequence: number,
    content: string,
  ): Message | undefined {
    return this.databaseService.db.transaction((tx) => {
      const [message] = tx
        .update(messages)
        .set({
          content,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(messages.id, messageId),
            eq(messages.conversationId, conversationId),
            eq(messages.sequence, sequence),
          ),
        )
        .returning()
        .all();

      if (!message) {
        return undefined;
      }

      tx.delete(messages)
        .where(
          and(
            eq(messages.conversationId, conversationId),
            gt(messages.sequence, sequence),
          ),
        )
        .run();

      return message;
    });
  }
}
