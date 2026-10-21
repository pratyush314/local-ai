import { z } from 'zod';

import {
	PROJECT_MEMORY_KINDS,
	PROJECT_MEMORY_SOURCE_TYPES,
} from '@local-ai/constants';

export const createProjectMemorySchema = z
	.object({
		projectId: z.string().uuid(),
		kind: z.enum(PROJECT_MEMORY_KINDS),
		subject: z.string().trim().min(1).max(200),
		content: z.string().trim().min(1).max(20_000),
		sourceType: z.enum(PROJECT_MEMORY_SOURCE_TYPES),
		sourceMessageId: z.string().uuid().nullable().optional(),
		sourcePath: z.string().trim().min(1).nullable().optional(),
		sourceReference: z.string().trim().min(1).nullable().optional(),
		confidence: z.number().min(0).max(1).nullable().optional(),
	})
	.superRefine((input, context) => {
		if (input.sourceType === 'message' && !input.sourceMessageId) {
			context.addIssue({
				code: 'custom',
				path: ['sourceMessageId'],
				message: 'A source message ID is required for message-based memories',
			});
		}

		if (input.sourceType === 'file' && !input.sourcePath) {
			context.addIssue({
				code: 'custom',
				path: ['sourcePath'],
				message: 'A source path is required for file-based memories',
			});
		}
	});

export type CreateProjectMemoryInput = z.infer<
	typeof createProjectMemorySchema
>;
