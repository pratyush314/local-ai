import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { timestamps } from './base-columns.js';

export const conversations = sqliteTable(
  'conversations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    title: text('title').notNull(),

    ...timestamps,
  },
  (table) => [index('conversations_updated_at_idx').on(table.updatedAt)],
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
