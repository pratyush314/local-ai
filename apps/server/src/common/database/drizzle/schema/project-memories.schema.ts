import { index, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { timestamps } from './base-columns.js';
import { messages } from './messages.schema.js';
import { projects } from './projects.schema.js';
import {
  PROJECT_MEMORY_KINDS,
  PROJECT_MEMORY_SOURCE_TYPES,
  PROJECT_MEMORY_STATUSES,
} from '@local-ai/constants';

export const projectMemories = sqliteTable(
  'project_memories',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),

    kind: text('kind', {
      enum: PROJECT_MEMORY_KINDS,
    }).notNull(),

    subject: text('subject').notNull(),

    content: text('content').notNull(),

    status: text('status', {
      enum: PROJECT_MEMORY_STATUSES,
    })
      .notNull()
      .default('active'),

    // Optional confidence score from 0 to 1.
    // Application-level validation will be added later.
    confidence: real('confidence'),

    sourceType: text('source_type', {
      enum: PROJECT_MEMORY_SOURCE_TYPES,
    }).notNull(),

    // Preserve the original chat message as evidence when applicable.
    // If that message is deleted, retain the memory but clear this link.
    sourceMessageId: text('source_message_id').references(() => messages.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),

    // Used later for file provenance, such as a source file path.
    sourcePath: text('source_path'),

    // Optional additional reference, such as a decision or source location.
    sourceReference: text('source_reference'),

    ...timestamps,
  },
  (table) => [
    index('project_memories_project_status_idx').on(
      table.projectId,
      table.status,
    ),

    index('project_memories_project_kind_idx').on(table.projectId, table.kind),

    index('project_memories_source_message_idx').on(table.sourceMessageId),
  ],
);

export type ProjectMemory = typeof projectMemories.$inferSelect;
export type NewProjectMemory = typeof projectMemories.$inferInsert;
