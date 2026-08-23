import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { timestamps } from './base-columns';
import { conversations } from './conversations.schema';

export const messages = sqliteTable(
  'messages',
  {
    id: text('id').primaryKey(),

    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    role: text('role', {
      enum: ['system', 'user', 'assistant'],
    }).notNull(),

    content: text('content').notNull(),

    ...timestamps,
  },
  (table) => [
    index('messages_conversation_id_idx').on(table.conversationId),

    index('messages_conversation_created_at_idx').on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
