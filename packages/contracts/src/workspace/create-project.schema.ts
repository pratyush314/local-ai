import { z } from 'zod';

export const createProjectSchema = z.object({
	name: z.string().trim().min(1).max(120),
	rootPath: z.string().trim().min(1).nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
