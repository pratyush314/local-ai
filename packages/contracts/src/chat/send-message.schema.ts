import { z } from 'zod';

export const sendMessageSchema = z.object({
	conversationId: z.string().uuid(),
	content: z.string().trim().min(1).max(100_000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
