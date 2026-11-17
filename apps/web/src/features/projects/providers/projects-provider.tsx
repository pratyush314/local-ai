'use client';

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';

import type {
	CreateProjectInput,
	Project,
	UpdateProjectInput,
} from '@local-ai/contracts/project';

import {
	createProject as createProjectRequest,
	deleteProject as deleteProjectRequest,
	getProjects,
	updateProject as updateProjectRequest,
} from '../lib/project-api';

interface ProjectsContextValue {
	projects: Project[];
	isLoading: boolean;
	error: string | null;
	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;
	refreshProjects: () => Promise<void>;
	createProject: (input: CreateProjectInput) => Promise<Project>;
	updateProject: (
		projectId: string,
		input: UpdateProjectInput,
	) => Promise<Project>;
	deleteProject: (projectId: string) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

function getErrorMessage(error: unknown): string {
	return error instanceof Error
		? error.message
		: 'Something went wrong while loading projects.';
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
	const [projects, setProjects] = useState<Project[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const requestIdRef = useRef(0);

	const refreshProjects = useCallback(async () => {
		const requestId = ++requestIdRef.current;

		setIsLoading(true);
		setError(null);

		try {
			const result = await getProjects();

			if (requestId === requestIdRef.current) {
				setProjects(result);
			}
		} catch (error) {
			if (requestId === requestIdRef.current) {
				setError(getErrorMessage(error));
			}
		} finally {
			if (requestId === requestIdRef.current) {
				setIsLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		const refreshProjectsFn = () => {
			void refreshProjects();
		};

		refreshProjectsFn();

		return () => {
			requestIdRef.current += 1;
		};
	}, [refreshProjects]);

	const createProject = useCallback(async (input: CreateProjectInput) => {
		setIsCreating(true);

		try {
			const project = await createProjectRequest(input);

			setProjects((current) => [
				project,
				...current.filter((item) => item.id !== project.id),
			]);

			return project;
		} finally {
			setIsCreating(false);
		}
	}, []);

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
		[],
	);

	const deleteProject = useCallback(async (projectId: string) => {
		setIsDeleting(true);

		try {
			await deleteProjectRequest(projectId);

			setProjects((current) =>
				current.filter((project) => project.id !== projectId),
			);
		} finally {
			setIsDeleting(false);
		}
	}, []);

	const value = useMemo(
		() => ({
			projects,
			isLoading,
			error,
			isCreating,
			isUpdating,
			isDeleting,
			refreshProjects,
			createProject,
			updateProject,
			deleteProject,
		}),
		[
			projects,
			isLoading,
			error,
			isCreating,
			isUpdating,
			isDeleting,
			refreshProjects,
			createProject,
			updateProject,
			deleteProject,
		],
	);

	return (
		<ProjectsContext.Provider value={value}>
			{children}
		</ProjectsContext.Provider>
	);
}

export function useProjectsContext() {
	const context = useContext(ProjectsContext);

	if (!context) {
		throw new Error('useProjectsContext must be used within ProjectsProvider');
	}

	return context;
}
