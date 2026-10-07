import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import { CHAT_ROLES, MESSAGE_STATUS } from '@local-ai/constants/chat';

import { timestamps } from './base-columns.js';
import { conversations } from './conversations.schema.js';

export const messages = sqliteTable(
  'messages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    conversationId: text('conversation_id')
      .notNull()
      .references(() => conversations.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    sequence: integer('sequence').notNull(),

    role: text('role', {
      enum: [CHAT_ROLES.SYSTEM, CHAT_ROLES.USER, CHAT_ROLES.ASSISTANT],
    }).notNull(),

    content: text('content').notNull(),

    status: text('status', {
      enum: [
        MESSAGE_STATUS.PENDING,
        MESSAGE_STATUS.STREAMING,
        MESSAGE_STATUS.COMPLETED,
        MESSAGE_STATUS.FAILED,
        MESSAGE_STATUS.CANCELLED,
      ],
    })
      .notNull()
      .default(MESSAGE_STATUS.COMPLETED),

    ...timestamps,
  },
  (table) => [
    index('messages_conversation_id_idx').on(table.conversationId),

    uniqueIndex('messages_conversation_sequence_unique_idx').on(
      table.conversationId,
      table.sequence,
    ),

    index('messages_conversation_created_at_idx').on(
      table.conversationId,
      table.createdAt,
    ),

    index('messages_status_idx').on(table.status),
  ],
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type CreateMessage = Omit<NewMessage, 'sequence'>;
