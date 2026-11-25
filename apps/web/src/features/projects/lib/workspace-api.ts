import { z } from 'zod';

import {
	createWorkspaceDirectorySchema,
	workspaceDirectorySchema,
	workspaceScanResultSchema,
	workspaceContentIndexResultSchema,
	type CreateWorkspaceDirectoryInput,
	type WorkspaceDirectory,
	type WorkspaceScanResult,
	type WorkspaceContentIndexResult,
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

export async function scanWorkspaceDirectory(
	directoryId: string,
): Promise<WorkspaceScanResult> {
	return apiClient({
		path: `/workspace-directories/${directoryId}/scan`,
		method: 'POST',
		responseSchema: workspaceScanResultSchema,
	});
}

export async function indexWorkspaceDirectory(
	directoryId: string,
): Promise<WorkspaceContentIndexResult> {
	return apiClient({
		path: `/workspace-directories/${directoryId}/index`,
		method: 'POST',
		responseSchema: workspaceContentIndexResultSchema,
	});
}
