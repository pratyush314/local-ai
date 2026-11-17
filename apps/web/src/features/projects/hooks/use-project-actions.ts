'use client';

import { useCallback, useState } from 'react';

import type {
	CreateProjectInput,
	Project,
	UpdateProjectInput,
} from '@local-ai/contracts/project';

import {
	createProject as createProjectRequest,
	deleteProject as deleteProjectRequest,
	updateProject as updateProjectRequest,
} from '../lib/project-api';

interface UseProjectActionsOptions {
	setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

interface UseProjectActionsResult {
	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;
	createProject: (input: CreateProjectInput) => Promise<Project>;
	updateProject: (
		projectId: string,
		input: UpdateProjectInput,
	) => Promise<Project>;
	deleteProject: (projectId: string) => Promise<void>;
}

export function useProjectActions({
	setProjects,
}: UseProjectActionsOptions): UseProjectActionsResult {
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const createProject = useCallback(
		async (input: CreateProjectInput) => {
			setIsCreating(true);

			try {
				const project = await createProjectRequest(input);

				setProjects((current) => [project, ...current]);

				return project;
			} finally {
				setIsCreating(false);
			}
		},
		[setProjects],
	);

	const updateProject = useCallback(
		async (projectId: string, input: UpdateProjectInput) => {
			setIsUpdating(true);

			try {
				const updatedProject = await updateProjectRequest(projectId, input);

				setProjects((current) =>
					current.map((project) =>
						project.id === projectId ? updatedProject : project,
					),
				);

				return updatedProject;
			} finally {
				setIsUpdating(false);
			}
		},
		[setProjects],
	);

	const deleteProject = useCallback(
		async (projectId: string) => {
			setIsDeleting(true);

			try {
				await deleteProjectRequest(projectId);

				setProjects((current) =>
					current.filter((project) => project.id !== projectId),
				);
			} finally {
				setIsDeleting(false);
			}
		},
		[setProjects],
	);

	return {
		isCreating,
		isUpdating,
		isDeleting,
		createProject,
		updateProject,
		deleteProject,
	};
}
