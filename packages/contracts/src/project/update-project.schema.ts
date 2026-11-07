import { z } from 'zod';

export const updateProjectSchema = z
	.object({
		name: z.string().trim().min(1).max(120).optional(),
	})
	.refine((input) => input.name !== undefined, {
		message: 'At least one field must be provided',
	});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
