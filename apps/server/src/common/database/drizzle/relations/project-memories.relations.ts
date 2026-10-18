import { relations } from 'drizzle-orm';

import { messages } from '../schema/messages.schema.js';
import { projectMemories } from '../schema/project-memories.schema.js';
import { projects } from '../schema/projects.schema.js';

export const projectMemoriesRelations = relations(
  projectMemories,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectMemories.projectId],
      references: [projects.id],
    }),

    sourceMessage: one(messages, {
      fields: [projectMemories.sourceMessageId],
      references: [messages.id],
    }),
  }),
);
