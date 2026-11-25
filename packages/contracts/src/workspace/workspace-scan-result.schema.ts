import { z } from 'zod';

export const workspaceScanResultSchema = z.object({
	workspaceDirectoryId: z.string().uuid(),
	discovered: z.number().int().nonnegative(),
	added: z.number().int().nonnegative(),
	changed: z.number().int().nonnegative(),
	unchanged: z.number().int().nonnegative(),
	removed: z.number().int().nonnegative(),
	skipped: z.number().int().nonnegative(),
});

export type WorkspaceScanResult = z.infer<typeof workspaceScanResultSchema>;
