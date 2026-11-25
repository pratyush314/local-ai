'use client';

import { useState } from 'react';

import type { Project } from '@local-ai/contracts/project';
import type {
	WorkspaceContentIndexResult,
	WorkspaceScanResult,
} from '@local-ai/contracts/workspace';

import { useProjectsContext } from '../providers/projects-provider';
import {
	createWorkspaceDirectory,
	scanWorkspaceDirectory,
	indexWorkspaceDirectory,
} from '../lib/workspace-api';

import { CreateProjectDialog } from './create-project-dialog';
import { ProjectCard } from './project-card';

interface PendingWorkspaceSetup {
	projectId: string;
	projectName: string;
	folderPath: string;
	workspaceDirectoryId?: string;
}

interface WorkspaceSetupResult {
	scan: WorkspaceScanResult;
	indexing: WorkspaceContentIndexResult;
}

type WorkspaceSetupStage =
	| 'idle'
	| 'registering'
	| 'scanning'
	| 'indexing'
	| 'completed';

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

	const [pendingSetup, setPendingSetup] =
		useState<PendingWorkspaceSetup | null>(null);

	const [setupError, setSetupError] = useState<string | null>(null);

	const [setupStage, setSetupStage] = useState<WorkspaceSetupStage>('idle');

	const [setupResult, setSetupResult] = useState<WorkspaceSetupResult | null>(
		null,
	);

	const [isSettingUpWorkspace, setIsSettingUpWorkspace] = useState(false);

	async function runWorkspaceIndexing(
		workspaceDirectoryId: string,
	): Promise<void> {
		setIsSettingUpWorkspace(true);
		setSetupError(null);
		setSetupResult(null);

		try {
			setSetupStage('scanning');

			const scan = await scanWorkspaceDirectory(workspaceDirectoryId);

			setSetupStage('indexing');

			const indexing = await indexWorkspaceDirectory(workspaceDirectoryId);

			setSetupResult({ scan, indexing });
			setPendingSetup(null);
			setSetupStage('completed');
		} catch (error) {
			setSetupError(
				error instanceof Error
					? error.message
					: 'Workspace scanning or indexing failed.',
			);
		} finally {
			setIsSettingUpWorkspace(false);
		}
	}

	async function registerFolder(
		projectId: string,
		projectName: string,
		folderPath: string,
	): Promise<void> {
		setIsSettingUpWorkspace(true);
		setSetupError(null);
		setSetupResult(null);
		setSetupStage('registering');

		try {
			const directory = await createWorkspaceDirectory(projectId, {
				name: getFolderName(folderPath) || projectName,
				path: folderPath,
			});

			// Save the ID immediately. If scanning or indexing fails,
			// retries can reuse this registration instead of creating another.
			setPendingSetup({
				projectId,
				projectName,
				folderPath,
				workspaceDirectoryId: directory.id,
			});

			await runWorkspaceIndexing(directory.id);
		} catch (error) {
			// Registration failed, so there is no directory ID to reuse yet.
			setPendingSetup({
				projectId,
				projectName,
				folderPath,
			});

			setSetupError(
				error instanceof Error
					? error.message
					: 'The project was created, but its folder could not be registered.',
			);
		} finally {
			setIsSettingUpWorkspace(false);
		}
	}

	async function handleCreate(
		name: string,
		folderPath: string | null,
	): Promise<void> {
		const project = await createProject({ name });

		if (folderPath) {
			await registerFolder(project.id, project.name, folderPath);
		}
	}

	async function handleRetrySetup(): Promise<void> {
		if (!pendingSetup || isSettingUpWorkspace) {
			return;
		}

		const directoryId = pendingSetup.workspaceDirectoryId;

		if (directoryId) {
			// Registration already succeeded. Retry scan and indexing.
			await runWorkspaceIndexing(directoryId);
			return;
		}

		// Registration itself failed. Retry registration first.
		await registerFolder(
			pendingSetup.projectId,
			pendingSetup.projectName,
			pendingSetup.folderPath,
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

		if (pendingSetup?.projectId === project.id) {
			setPendingSetup(null);
			setSetupError(null);
			setSetupStage('idle');
		}
	}

	const setupStageLabel = {
		idle: '',
		registering: 'Registering folder...',
		scanning: 'Scanning workspace files...',
		indexing: 'Indexing workspace content...',
		completed: 'Workspace indexed successfully.',
	}[setupStage];

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

			{pendingSetup && setupError && (
				<div
					role="alert"
					className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
				>
					<div>
						<p className="font-medium">
							Project created, but workspace setup did not finish.
						</p>

						<p className="mt-1 text-muted-foreground">
							{pendingSetup.projectName}: {setupError}
						</p>

						<p className="mt-1 break-all text-xs text-muted-foreground">
							{pendingSetup.folderPath}
						</p>
					</div>

					<button
						type="button"
						onClick={() => void handleRetrySetup()}
						disabled={isSettingUpWorkspace}
						className="font-medium underline disabled:opacity-50"
					>
						{isSettingUpWorkspace ? 'Working...' : 'Retry workspace setup'}
					</button>
				</div>
			)}

			{isSettingUpWorkspace && (
				<div
					role="status"
					aria-live="polite"
					className="rounded-lg border border-border p-3 text-sm"
				>
					<p className="font-medium">{setupStageLabel}</p>
					<p className="mt-1 text-muted-foreground">
						This may take a while for larger workspaces. Keep this page open.
					</p>
				</div>
			)}

			{setupResult && (
				<div className="space-y-2 rounded-lg border border-border p-4 text-sm">
					<p className="font-medium">Workspace indexing completed</p>

					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div>
							<p className="text-muted-foreground">Discovered</p>
							<p className="text-lg font-semibold tabular-nums">
								{setupResult.scan.discovered}
							</p>
						</div>

						<div>
							<p className="text-muted-foreground">Indexed</p>
							<p className="text-lg font-semibold tabular-nums">
								{setupResult.indexing.indexed}
							</p>
						</div>

						<div>
							<p className="text-muted-foreground">Skipped</p>
							<p className="text-lg font-semibold tabular-nums">
								{setupResult.scan.skipped}
							</p>
						</div>

						<div>
							<p className="text-muted-foreground">Failed</p>
							<p className="text-lg font-semibold tabular-nums">
								{setupResult.indexing.failed}
							</p>
						</div>
					</div>

					<p className="text-xs text-muted-foreground">
						Added: {setupResult.scan.added} · Changed:{' '}
						{setupResult.scan.changed} · Unchanged: {setupResult.scan.unchanged}{' '}
						· Removed: {setupResult.scan.removed}
					</p>
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
				isProcessing={isSettingUpWorkspace}
				processingLabel={setupStageLabel}
				onClose={() => setCreateDialogOpen(false)}
				onCreate={handleCreate}
			/>
		</section>
	);
}
