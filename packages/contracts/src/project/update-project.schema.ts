import { z } from 'zod';

export const updateProjectSchema = z
	.object({
		name: z.string().trim().min(1).max(120).optional(),
		rootPath: z.string().trim().min(1).nullable().optional(),
	})
	.refine((input) => input.name !== undefined || input.rootPath !== undefined, {
		message: 'At least one field must be provided',
	});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
