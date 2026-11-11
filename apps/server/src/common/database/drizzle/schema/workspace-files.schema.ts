import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import { timestamps } from './base-columns.js';
import { workspaceDirectories } from './workspace-directories.schema.js';
import { WORKSPACE_FILE_INDEX_STATUS } from '@local-ai/constants/workspace';

export const workspaceFiles = sqliteTable(
  'workspace_files',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    workspaceDirectoryId: text('workspace_directory_id')
      .notNull()
      .references(() => workspaceDirectories.id, {
        onDelete: 'cascade',
      }),

    relativePath: text('relative_path').notNull(),

    name: text('name').notNull(),

    extension: text('extension'),

    size: integer('size').notNull(),

    modifiedAt: integer('modified_at', {
      mode: 'timestamp_ms',
    }).notNull(),

    contentHash: text('content_hash'),

    indexStatus: text('index_status')
      .notNull()
      .default(WORKSPACE_FILE_INDEX_STATUS.PENDING),

    indexedAt: integer('indexed_at', {
      mode: 'timestamp_ms',
    }),

    ...timestamps,
  },
  (table) => [
    index('workspace_files_directory_id_idx').on(table.workspaceDirectoryId),

    uniqueIndex('workspace_files_directory_path_unique').on(
      table.workspaceDirectoryId,
      table.relativePath,
    ),

    index('workspace_files_index_status_idx').on(table.indexStatus),
  ],
);

export type WorkspaceFile = typeof workspaceFiles.$inferSelect;

export type NewWorkspaceFile = typeof workspaceFiles.$inferInsert;
