import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { timestamps } from './base-columns.js';

export const projects = sqliteTable(
  'projects',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    name: text('name').notNull(),

    rootPath: text('root_path'),

    ...timestamps,
  },
  (table) => [index('projects_updated_at_idx').on(table.updatedAt)],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
