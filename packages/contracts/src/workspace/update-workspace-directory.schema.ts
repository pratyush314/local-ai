import { z } from 'zod';

export const updateWorkspaceDirectorySchema = z
	.object({
		name: z.string().trim().min(1).max(120).optional(),
		path: z.string().trim().min(1).max(2048).optional(),
	})
	.refine((input) => input.name !== undefined || input.path !== undefined, {
		message: 'At least one field must be provided',
	});

export type UpdateWorkspaceDirectoryInput = z.infer<
	typeof updateWorkspaceDirectorySchema
>;
