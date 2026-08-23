import { relations } from 'drizzle-orm';

import { conversations } from '../schema/conversations.schema';
import { messages } from '../schema/messages.schema';

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));
