import { z } from 'zod';

import {
	createWorkspaceDirectorySchema,
	workspaceDirectorySchema,
	type CreateWorkspaceDirectoryInput,
	type WorkspaceDirectory,
} from '@local-ai/contracts/workspace';

import { apiClient } from '@/lib/api/apiClient';

const workspaceDirectoryListSchema = z.array(workspaceDirectorySchema);

export async function createWorkspaceDirectory(
	projectId: string,
	input: CreateWorkspaceDirectoryInput,
): Promise<WorkspaceDirectory> {
	return apiClient({
		path: `/projects/${projectId}/workspace-directories`,
		method: 'POST',
		body: input,
		bodySchema: createWorkspaceDirectorySchema,
		responseSchema: workspaceDirectorySchema,
	});
}

export async function getWorkspaceDirectories(
	projectId: string,
): Promise<WorkspaceDirectory[]> {
	return apiClient({
		path: `/projects/${projectId}/workspace-directories`,
		method: 'GET',
		responseSchema: workspaceDirectoryListSchema,
	});
}
