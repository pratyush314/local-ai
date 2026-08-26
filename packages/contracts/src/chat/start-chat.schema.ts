import { z } from 'zod';

import { CHAT_MESSAGE_LIMITS } from '@local-ai/constants/chat';

export const startChatSchema = z.object({
	content: z.string().trim().min(1).max(CHAT_MESSAGE_LIMITS.MAX_CONTENT_LENGTH),
});

export type StartChatInput = z.infer<typeof startChatSchema>;
