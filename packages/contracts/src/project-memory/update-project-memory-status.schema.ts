import { z } from 'zod';

import { PROJECT_MEMORY_STATUSES } from '@local-ai/constants';

export const updateProjectMemoryStatusSchema = z.object({
	status: z.enum(PROJECT_MEMORY_STATUSES),
});

export type UpdateProjectMemoryStatusInput = z.infer<
	typeof updateProjectMemoryStatusSchema
>;
