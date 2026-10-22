import { z } from 'zod';

import { PROJECT_MEMORY_KINDS } from '@local-ai/constants';

export const extractedProjectMemorySchema = z.object({
	kind: z.enum(PROJECT_MEMORY_KINDS),
	subject: z.string().trim().min(1).max(200),
	content: z.string().trim().min(1).max(20_000),
	confidence: z.number().min(0).max(1),
});

export const extractProjectMemoriesSchema = z.object({
	memories: z.array(extractedProjectMemorySchema).max(5),
});

export type ExtractedProjectMemory = z.infer<
	typeof extractedProjectMemorySchema
>;

export type ExtractProjectMemories = z.infer<
	typeof extractProjectMemoriesSchema
>;
