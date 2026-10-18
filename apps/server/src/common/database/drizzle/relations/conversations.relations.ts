import { relations } from 'drizzle-orm';

import { conversations } from '../schema/conversations.schema.js';
import { messages } from '../schema/messages.schema.js';
import { projects } from '../schema/projects.schema.js';

export const conversationsRelations = relations(
  conversations,
  ({ many, one }) => ({
    messages: many(messages),
    project: one(projects, {
      fields: [conversations.projectId],
      references: [projects.id],
    }),
  }),
);
