import { z } from 'zod';

export const assignConversationProjectSchema = z.object({
	projectId: z.string().uuid(),
});

export type AssignConversationProjectInput = z.infer<
	typeof assignConversationProjectSchema
>;
