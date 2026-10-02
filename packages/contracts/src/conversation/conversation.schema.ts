import { z } from 'zod';

export const conversationSchema = z.object({
	id: z.string().uuid(),

	title: z.string(),

	createdAt: z.string(),

	updatedAt: z.string(),
});

export type Conversation = z.infer<typeof conversationSchema>;
