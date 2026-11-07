import { z } from 'zod';

export const projectIdSchema = z.string().uuid();

export const projectSchema = z.object({
	id: projectIdSchema,
	name: z.string(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type Project = z.infer<typeof projectSchema>;
