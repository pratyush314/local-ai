import { z } from 'zod';

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
