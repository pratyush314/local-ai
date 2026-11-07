import { z } from 'zod';

export const workspaceDirectoryIdSchema = z.string().uuid();

export const workspaceDirectorySchema = z.object({
	id: workspaceDirectoryIdSchema,
	projectId: z.string().uuid(),
	name: z.string(),
	path: z.string(),
	status: z.string(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type WorkspaceDirectory = z.infer<typeof workspaceDirectorySchema>;
