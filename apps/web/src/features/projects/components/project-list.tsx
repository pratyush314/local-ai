'use client';

import { useState } from 'react';

import type { Project } from '@local-ai/contracts/project';

import { useProjectsContext } from '../providers/projects-provider';
import { createWorkspaceDirectory } from '../lib/workspace-api';

import { CreateProjectDialog } from './create-project-dialog';
import { ProjectCard } from './project-card';

interface PendingRegistration {
	projectId: string;
	projectName: string;
	folderPath: string;
}

function getFolderName(path: string): string {
	const segments = path.split(/[\\/]/).filter(Boolean);
	return segments.at(-1) ?? 'Workspace';
}

export function ProjectList() {
	const {
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
	} = useProjectsContext();

	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [pendingRegistration, setPendingRegistration] =
		useState<PendingRegistration | null>(null);
	const [registrationError, setRegistrationError] = useState<string | null>(
		null,
	);
	const [isRegistering, setIsRegistering] = useState(false);

	async function registerFolder(
		projectId: string,
		projectName: string,
		folderPath: string,
	) {
		setIsRegistering(true);
		setRegistrationError(null);

		try {
			await createWorkspaceDirectory(projectId, {
				name: getFolderName(folderPath) || projectName,
				path: folderPath,
			});

			setPendingRegistration(null);
		} catch (error) {
			setPendingRegistration({
				projectId,
				projectName,
				folderPath,
			});

			setRegistrationError(
				error instanceof Error
					? error.message
					: 'The project was created, but its folder could not be registered.',
			);
		} finally {
			setIsRegistering(false);
		}
	}

	async function handleCreate(name: string, folderPath: string | null) {
		const project = await createProject({ name });

		if (folderPath) {
			await registerFolder(project.id, project.name, folderPath);
		}
	}

	async function handleRetryRegistration() {
		if (!pendingRegistration) {
			return;
		}

		await registerFolder(
			pendingRegistration.projectId,
			pendingRegistration.projectName,
			pendingRegistration.folderPath,
		);
	}

	async function handleRename(project: Project) {
		const nextName = window.prompt('Enter the new project name:', project.name);

		if (nextName === null || !nextName.trim()) {
			return;
		}

		await updateProject(project.id, { name: nextName });
	}

	async function handleDelete(project: Project) {
		const confirmed = window.confirm(
			`Delete project "${project.name}"? This cannot be undone.`,
		);

		if (!confirmed) {
			return;
		}

		await deleteProject(project.id);

		if (pendingRegistration?.projectId === project.id) {
			setPendingRegistration(null);
			setRegistrationError(null);
		}
	}

	return (
		<section className="space-y-5">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-xl font-semibold">Projects</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Organize your work into projects.
					</p>
				</div>

				<button
					type="button"
					onClick={() => setCreateDialogOpen(true)}
					className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
				>
					New project
				</button>
			</div>

			{error && (
				<div
					role="alert"
					className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
				>
					<p>{error}</p>

					<button
						type="button"
						onClick={() => void refreshProjects()}
						className="shrink-0 font-medium underline"
					>
						Retry
					</button>
				</div>
			)}

			{registrationError && pendingRegistration && (
				<div
					role="alert"
					className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
				>
					<p className="font-medium">
						Project created, but folder registration failed.
					</p>

					<p className="text-muted-foreground">
						{pendingRegistration.projectName}: {registrationError}
					</p>

					<button
						type="button"
						onClick={() => void handleRetryRegistration()}
						disabled={isRegistering}
						className="font-medium underline disabled:opacity-50"
					>
						{isRegistering ? 'Registering...' : 'Retry folder registration'}
					</button>
				</div>
			)}

			{isLoading ? (
				<p className="py-10 text-center text-sm text-muted-foreground">
					Loading projects...
				</p>
			) : projects.length === 0 ? (
				<div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
					<h2 className="font-medium">No projects yet</h2>

					<p className="mt-2 text-sm text-muted-foreground">
						Create your first project to get started.
					</p>

					<button
						type="button"
						onClick={() => setCreateDialogOpen(true)}
						className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
					>
						Create your first project
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{projects.map((project) => (
						<ProjectCard
							key={project.id}
							project={project}
							onRename={handleRename}
							onDelete={handleDelete}
						/>
					))}
				</div>
			)}

			{(isUpdating || isDeleting) && (
				<p className="text-xs text-muted-foreground" aria-live="polite">
					Saving changes...
				</p>
			)}

			<CreateProjectDialog
				open={createDialogOpen}
				isCreating={isCreating}
				onClose={() => setCreateDialogOpen(false)}
				onCreate={handleCreate}
			/>
		</section>
	);
}
