import { relations } from 'drizzle-orm';

import { conversations } from '../schema/conversations.schema.js';
import { messages } from '../schema/messages.schema.js';

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));
