import { z } from 'zod';

export const conversationSchema = z.object({
	id: z.string().uuid(),

	title: z.string(),

	createdAt: z.string(),

	updatedAt: z.string(),
});

export const deleteConversationSchema = z.object({
	success: z.literal(true),
});

export type Conversation = z.infer<typeof conversationSchema>;
