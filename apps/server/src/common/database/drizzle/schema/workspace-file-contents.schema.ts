import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { workspaceFiles } from './workspace-files.schema.js';

export const workspaceFileContents = sqliteTable('workspace_file_contents', {
  fileId: text('file_id')
    .primaryKey()
    .references(() => workspaceFiles.id, {
      onDelete: 'cascade',
    }),

  content: text('content').notNull(),

  tokenCount: integer('token_count'),

  updatedAt: integer('updated_at', {
    mode: 'timestamp_ms',
  })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type WorkspaceFileContent = typeof workspaceFileContents.$inferSelect;

export type NewWorkspaceFileContent = typeof workspaceFileContents.$inferInsert;
