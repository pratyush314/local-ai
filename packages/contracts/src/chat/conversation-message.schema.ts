import { z } from 'zod';

import { CHAT_ROLES, MESSAGE_STATUS } from '@local-ai/constants/chat';

export const conversationMessageSchema = z.object({
	id: z.string().uuid(),

	conversationId: z.string().uuid(),

	role: z.enum([CHAT_ROLES.SYSTEM, CHAT_ROLES.USER, CHAT_ROLES.ASSISTANT]),

	content: z.string(),

	status: z.enum([
		MESSAGE_STATUS.PENDING,
		MESSAGE_STATUS.STREAMING,
		MESSAGE_STATUS.COMPLETED,
		MESSAGE_STATUS.FAILED,
		MESSAGE_STATUS.CANCELLED,
	]),

	createdAt: z.string(),

	updatedAt: z.string(),
});

export const conversationMessagesSchema = z.array(conversationMessageSchema);

export type ConversationMessage = z.infer<typeof conversationMessageSchema>;

export type ConversationMessages = z.infer<typeof conversationMessagesSchema>;
