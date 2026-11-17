'use client';

import type { Project } from '@local-ai/contracts/project';

interface ProjectCardProps {
	project: Project;
	onRename: (project: Project) => void;
	onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onRename, onDelete }: ProjectCardProps) {
	return (
		<article className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
			<div className="min-w-0">
				<h3 className="truncate font-medium">{project.name}</h3>

				<p className="mt-1 text-xs text-muted-foreground">
					Created {new Date(project.createdAt).toLocaleDateString()}
				</p>
			</div>

			<div className="flex shrink-0 items-center gap-2">
				<button
					type="button"
					onClick={() => onRename(project)}
					className="rounded-md px-3 py-1.5 text-sm hover:bg-muted"
				>
					Rename
				</button>

				<button
					type="button"
					onClick={() => onDelete(project)}
					className="rounded-md px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
				>
					Delete
				</button>
			</div>
		</article>
	);
}
