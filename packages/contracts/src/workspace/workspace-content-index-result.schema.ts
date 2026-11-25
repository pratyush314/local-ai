import { z } from 'zod';

export const workspaceContentIndexResultSchema = z.object({
	workspaceDirectoryId: z.string().uuid(),
	pending: z.number().int().nonnegative(),
	indexed: z.number().int().nonnegative(),
	failed: z.number().int().nonnegative(),
});

export type WorkspaceContentIndexResult = z.infer<
	typeof workspaceContentIndexResultSchema
>;
