import { z } from 'zod';

export const createConversationSchema = z.object({
	projectId: z.string().uuid().nullable().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
