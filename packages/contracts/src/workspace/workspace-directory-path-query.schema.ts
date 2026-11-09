import { z } from 'zod';

export const workspaceDirectoryPathQuerySchema = z.object({
	path: z.string().max(2048).optional(),
});

export const workspaceFileContentQuerySchema = z.object({
	path: z.string().min(1).max(2048),
});

export type WorkspaceDirectoryPathQuery = z.infer<
	typeof workspaceDirectoryPathQuerySchema
>;

export type WorkspaceFileContentQuery = z.infer<
	typeof workspaceFileContentQuerySchema
>;
