import { z } from 'zod';

import {
	createProjectSchema,
	projectSchema,
	updateProjectSchema,
} from '@local-ai/contracts/project';

import { API_ENDPOINTS } from '@/constants/api-constants';
import { apiClient } from '@/lib/api/apiClient';

import type {
	CreateProjectInput,
	Project,
	UpdateProjectInput,
} from '@local-ai/contracts/project';

const projectListSchema = z.array(projectSchema);

export async function getProjects(): Promise<Project[]> {
	return apiClient({
		path: API_ENDPOINTS.PROJECTS.LIST,
		method: 'GET',
		responseSchema: projectListSchema,
	});
}

export async function getProject(projectId: string): Promise<Project> {
	return apiClient({
		path: API_ENDPOINTS.PROJECTS.BY_ID(projectId),
		method: 'GET',
		responseSchema: projectSchema,
	});
}

export async function createProject(
	input: CreateProjectInput,
): Promise<Project> {
	return apiClient({
		path: API_ENDPOINTS.PROJECTS.CREATE,
		method: 'POST',
		body: input,
		bodySchema: createProjectSchema,
		responseSchema: projectSchema,
	});
}

export async function updateProject(
	projectId: string,
	input: UpdateProjectInput,
): Promise<Project> {
	return apiClient({
		path: API_ENDPOINTS.PROJECTS.UPDATE(projectId),
		method: 'PATCH',
		body: input,
		bodySchema: updateProjectSchema,
		responseSchema: projectSchema,
	});
}

export async function deleteProject(projectId: string): Promise<unknown> {
	return apiClient({
		path: API_ENDPOINTS.PROJECTS.DELETE(projectId),
		method: 'DELETE',
		responseSchema: z.unknown(),
	});
}
