'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Project } from '@local-ai/contracts/project';

import { getProjects } from '../lib/project-api';

interface UseProjectsResult {
	projects: Project[];
	isLoading: boolean;
	error: string | null;
	refresh: () => Promise<void>;
	setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error
		? error.message
		: 'Something went wrong while loading projects.';
}

export function useProjects(): UseProjectsResult {
	const [projects, setProjects] = useState<Project[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const requestIdRef = useRef(0);

	const refresh = useCallback(async () => {
		const requestId = ++requestIdRef.current;

		setIsLoading(true);
		setError(null);

		try {
			const result = await getProjects();

			// Ignore an older request if a newer refresh has started.
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
		void refresh();

		return () => {
			requestIdRef.current += 1;
		};
	}, [refresh]);

	return {
		projects,
		isLoading,
		error,
		refresh,
		setProjects,
	};
}
