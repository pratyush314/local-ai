import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { timestamps } from './base-columns.js';
import { projects } from './projects.schema.js';

export const conversations = sqliteTable(
  'conversations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    projectId: text('project_id').references(() => projects.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),

    title: text('title').notNull(),

    ...timestamps,
  },
  (table) => [index('conversations_updated_at_idx').on(table.updatedAt)],
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
