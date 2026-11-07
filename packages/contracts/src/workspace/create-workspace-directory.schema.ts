import { z } from 'zod';

export const createWorkspaceDirectorySchema = z.object({
	name: z.string().trim().min(1).max(120),
	path: z.string().trim().min(1).max(2048),
});

export type CreateWorkspaceDirectoryInput = z.infer<
	typeof createWorkspaceDirectorySchema
>;
