import { z } from 'zod';

import {
	PROJECT_MEMORY_KINDS,
	PROJECT_MEMORY_SOURCE_TYPES,
	PROJECT_MEMORY_STATUSES,
} from '@local-ai/constants';

export const projectMemoryIdSchema = z.string().uuid();

export const projectMemorySchema = z.object({
	id: projectMemoryIdSchema,
	projectId: z.string().uuid(),
	kind: z.enum(PROJECT_MEMORY_KINDS),
	subject: z.string(),
	content: z.string(),
	status: z.enum(PROJECT_MEMORY_STATUSES),
	confidence: z.number().nullable(),
	sourceType: z.enum(PROJECT_MEMORY_SOURCE_TYPES),
	sourceMessageId: z.string().uuid().nullable(),
	sourcePath: z.string().nullable(),
	sourceReference: z.string().nullable(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export type ProjectMemory = z.infer<typeof projectMemorySchema>;
