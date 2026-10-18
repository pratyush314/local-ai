import { relations } from 'drizzle-orm';

import { conversations } from '../schema/conversations.schema.js';
import { messages } from '../schema/messages.schema.js';
import { projectMemories } from '../schema/project-memories.schema.js';

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),

  projectMemories: many(projectMemories),
}));
