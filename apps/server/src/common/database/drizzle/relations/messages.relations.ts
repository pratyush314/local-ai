import { relations } from 'drizzle-orm';

import { conversations } from '../schema/conversations.schema';
import { messages } from '../schema/messages.schema';

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));
