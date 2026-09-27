import { z } from 'zod';
import { CHAT_MESSAGE_LIMITS } from '@local-ai/constants/chat';

export const chatStreamEventSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('conversation'),
		conversationId: z.string().uuid(),
	}),

	z.object({
		type: z.literal('conversation_updated'),
		conversationId: z.string().uuid(),
		title: z.string(),
	}),

	z.object({
		type: z.literal('message'),
		messageId: z.string().uuid(),
		role: z.enum(['user', 'assistant']),
	}),

	z.object({
		type: z.literal('token'),
		content: z.string(),
	}),

	z.object({
		type: z.literal('done'),
		messageId: z.string().uuid(),
	}),

	z.object({
		type: z.literal('error'),
		message: z.string(),
	}),

	z.object({
		type: z.literal('cancelled'),
		messageId: z.string().uuid(),
	}),
]);

export type ChatStreamEvent = z.infer<typeof chatStreamEventSchema>;

export const continueChatSchema = z.object({
	content: z
		.string()
		.trim()
		.min(1, { error: 'User prompt should not be empty' })
		.max(CHAT_MESSAGE_LIMITS.MAX_CONTENT_LENGTH),
});

export type ContinueChatInput = z.infer<typeof continueChatSchema>;

export const sendMessageSchema = z.object({
	content: z.string().trim().min(1).max(CHAT_MESSAGE_LIMITS.MAX_CONTENT_LENGTH),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const startChatSchema = z.object({
	content: z
		.string()
		.trim()
		.min(1, { error: 'User prompt should not be empty' })
		.max(CHAT_MESSAGE_LIMITS.MAX_CONTENT_LENGTH),
});

export type StartChatInput = z.infer<typeof startChatSchema>;
