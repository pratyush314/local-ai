import { z } from 'zod';

import { conversationSchema } from './conversation.schema';

export const conversationsSchema = z.array(conversationSchema);

export type Conversations = z.infer<typeof conversationsSchema>;
