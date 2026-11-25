'use client';

import { useState, type FormEvent } from 'react';

interface CreateProjectDialogProps {
	open: boolean;
	isCreating: boolean;
	isProcessing: boolean;
	processingLabel: string;
	onClose: () => void;
	onCreate: (name: string, folderPath: string | null) => Promise<void>;
}

interface FolderPickerResponse {
	path: string | null;
}

export function CreateProjectDialog({
	open,
	isCreating,
	isProcessing,
	processingLabel,
	onClose,
	onCreate,
}: CreateProjectDialogProps) {
	const [name, setName] = useState('');
	const [folderPath, setFolderPath] = useState<string | null>(null);
	const [isPickingFolder, setIsPickingFolder] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!open) {
		return null;
	}

	async function handleChooseFolder() {
		setIsPickingFolder(true);
		setError(null);

		try {
			const response = await fetch('/api/companion/select-folder', {
				method: 'POST',
			});

			const result = (await response.json()) as
				| FolderPickerResponse
				| { message?: string };

			if (!response.ok) {
				throw new Error(
					'message' in result && result.message
						? result.message
						: 'Unable to open the folder picker.',
				);
			}

			if ('path' in result) {
				setFolderPath(result.path);
			}
		} catch (error) {
			setError(
				error instanceof Error ? error.message : 'Unable to select a folder.',
			);
		} finally {
			setIsPickingFolder(false);
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const trimmedName = name.trim();

		if (!trimmedName) {
			setError('Project name is required.');
			return;
		}

		if (trimmedName.length > 120) {
			setError('Project name cannot exceed 120 characters.');
			return;
		}

		setError(null);

		try {
			await onCreate(trimmedName, folderPath);
			setName('');
			setFolderPath(null);
			onClose();
		} catch (error) {
			setError(
				error instanceof Error ? error.message : 'Unable to create project.',
			);
		}
	}

	const isBusy = isCreating || isPickingFolder || isProcessing;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget && !isBusy) {
					onClose();
				}
			}}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="create-project-title"
				className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl"
			>
				<div className="mb-5">
					<h2 id="create-project-title" className="text-lg font-semibold">
						Create project
					</h2>

					<p className="mt-1 text-sm text-muted-foreground">
						Create a project to organize your conversations and workspace.
					</p>
				</div>

				<form onSubmit={handleSubmit}>
					<label
						htmlFor="project-name"
						className="mb-2 block text-sm font-medium"
					>
						Project name
					</label>

					<input
						id="project-name"
						autoFocus
						maxLength={120}
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="e.g. Local AI"
						disabled={isBusy}
						className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
					/>

					<div className="mt-4">
						<label className="mb-2 block text-sm font-medium">
							Project folder
							<span className="ml-1 font-normal text-muted-foreground">
								(optional)
							</span>
						</label>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => void handleChooseFolder()}
								disabled={isBusy}
								className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
							>
								{isPickingFolder ? 'Opening...' : 'Choose folder'}
							</button>

							<span
								className="min-w-0 truncate text-xs text-muted-foreground"
								title={folderPath ?? undefined}
							>
								{folderPath ?? 'No folder selected'}
							</span>
						</div>

						{folderPath && (
							<button
								type="button"
								onClick={() => setFolderPath(null)}
								disabled={isBusy}
								className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
							>
								Remove selected folder
							</button>
						)}
					</div>

					{error && (
						<p role="alert" className="mt-3 text-sm text-destructive">
							{error}
						</p>
					)}

					<div className="mt-6 flex justify-end gap-2">
						<button
							type="button"
							disabled={isBusy}
							onClick={onClose}
							className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
						>
							Cancel
						</button>

						<button
							type="submit"
							disabled={isBusy || !name.trim()}
							className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isProcessing
								? processingLabel
								: isCreating
									? 'Creating...'
									: 'Create project'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
