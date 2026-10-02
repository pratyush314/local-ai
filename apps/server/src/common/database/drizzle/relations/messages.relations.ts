import { relations } from 'drizzle-orm';

import { conversations } from '../schema/conversations.schema.js';
import { messages } from '../schema/messages.schema.js';

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));
