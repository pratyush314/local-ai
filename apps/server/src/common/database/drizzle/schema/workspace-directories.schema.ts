import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { timestamps } from './base-columns.js';
import { projects } from './projects.schema.js';

export const workspaceDirectories = sqliteTable(
  'workspace_directories',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),

    path: text('path').notNull(),

    status: text('status').notNull().default('active'),

    ...timestamps,
  },
  (table) => [
    index('workspace_directories_project_id_idx').on(table.projectId),

    uniqueIndex('workspace_directories_project_path_unique').on(
      table.projectId,
      table.path,
    ),
  ],
);

export type WorkspaceDirectory = typeof workspaceDirectories.$inferSelect;

export type NewWorkspaceDirectory = typeof workspaceDirectories.$inferInsert;
