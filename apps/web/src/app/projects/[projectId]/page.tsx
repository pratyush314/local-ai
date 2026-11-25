'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { Project } from '@local-ai/contracts/project';
import type { WorkspaceDirectory } from '@local-ai/contracts/workspace';

import { getProject } from '@/features/projects/lib/project-api';
import { getWorkspaceDirectories } from '@/features/projects/lib/workspace-api';

import { ChatContent } from '@/features/chat/components/chats/chat-content';
import { useChat } from '@/features/chat/hooks/use-chat';
import { useConversations } from '@/features/conversations/hooks/use-conversations';

export default function ProjectDetailPage() {
	const { projectId } = useParams<{ projectId: string }>();

	const [project, setProject] = useState<Project | null>(null);
	const [directories, setDirectories] = useState<WorkspaceDirectory[]>([]);

	const [isProjectLoading, setIsProjectLoading] = useState(true);
	const [isDirectoriesLoading, setIsDirectoriesLoading] = useState(true);

	const [projectError, setProjectError] = useState<string | null>(null);
	const [directoriesError, setDirectoriesError] = useState<string | null>(null);

	const searchParams = useSearchParams();

	const initialConversationId = searchParams.get('conversationId');

	const [activeConversationId, setActiveConversationId] = useState<
		string | null
	>(initialConversationId);

	const {
		conversations,
		isLoading: isConversationsLoading,
		error: conversationsError,
		refresh: refreshConversations,
	} = useConversations({ projectId });

	const updateConversationUrl = useCallback((conversationId: string | null) => {
		const params = new URLSearchParams(window.location.search);

		if (conversationId) {
			params.set('conversationId', conversationId);
		} else {
			params.delete('conversationId');
		}

		const query = params.toString();
		const url = query
			? `${window.location.pathname}?${query}`
			: window.location.pathname;

		window.history.replaceState(window.history.state, '', url);
		setActiveConversationId(conversationId);
	}, []);

	useEffect(() => {
		const urlConversationId = searchParams.get('conversationId');
		const activeConversationIdFn = () => {
			setActiveConversationId((currentId) =>
				currentId === urlConversationId ? currentId : urlConversationId,
			);
		};
		activeConversationIdFn();
	}, [searchParams]);

	useEffect(() => {
		if (isConversationsLoading || conversationsError) {
			return;
		}
		const setConversationUrlToNull = () => {
			updateConversationUrl(null);
		};

		if (
			activeConversationId &&
			!conversations.some(
				(conversation) => conversation.id === activeConversationId,
			)
		) {
			setConversationUrlToNull();
		}
	}, [
		activeConversationId,
		conversations,
		isConversationsLoading,
		conversationsError,
		updateConversationUrl,
	]);

	const handleConversationChange = useCallback(
		(conversationId: string) => {
			updateConversationUrl(conversationId);
			void refreshConversations();
		},
		[updateConversationUrl, refreshConversations],
	);

	const handleConversationUpdated = useCallback(() => {
		void refreshConversations();
	}, [refreshConversations]);

	const {
		messages,
		title,
		isGenerating,
		isLoadingConversation,
		loadError,
		clearLoadError,
		sendMessage,
		stopGeneration,
		editMessage,
		regenerateMessage,
	} = useChat({
		conversationId: activeConversationId,
		onConversationChange: handleConversationChange,
		onConversationUpdated: handleConversationUpdated,
		projectId,
	});

	const handleNewChat = useCallback(() => {
		if (isGenerating) {
			return;
		}

		updateConversationUrl(null);
	}, [isGenerating, updateConversationUrl]);

	const handleSelectConversation = useCallback(
		(conversationId: string) => {
			if (isGenerating || conversationId === activeConversationId) {
				return;
			}

			updateConversationUrl(conversationId);
		},
		[activeConversationId, isGenerating, updateConversationUrl],
	);

	const loadProject = useCallback(async () => {
		setIsProjectLoading(true);
		setProjectError(null);

		try {
			const result = await getProject(projectId);
			setProject(result);
		} catch (error) {
			setProjectError(
				error instanceof Error ? error.message : 'Failed to load project.',
			);
		} finally {
			setIsProjectLoading(false);
		}
	}, [projectId]);

	const loadDirectories = useCallback(async () => {
		setIsDirectoriesLoading(true);
		setDirectoriesError(null);

		try {
			const result = await getWorkspaceDirectories(projectId);
			setDirectories(result);
		} catch (error) {
			setDirectoriesError(
				error instanceof Error
					? error.message
					: 'Failed to load workspace directories.',
			);
		} finally {
			setIsDirectoriesLoading(false);
		}
	}, [projectId]);

	useEffect(() => {
		const loadProjectsAndDirectories = () => {
			void loadProject();
			void loadDirectories();
		};
		loadProjectsAndDirectories();
	}, [loadProject, loadDirectories]);

	if (isProjectLoading) {
		return (
			<main className="mx-auto w-full max-w-5xl p-6 md:p-8">
				<p className="py-10 text-center text-sm text-muted-foreground">
					Loading project...
				</p>
			</main>
		);
	}

	if (projectError || !project) {
		return (
			<main className="mx-auto w-full max-w-5xl space-y-4 p-6 md:p-8">
				<Link
					href="/projects"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Back to projects
				</Link>

				<div
					role="alert"
					className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
				>
					<p className="text-sm">{projectError ?? 'Project not found.'}</p>

					<button
						type="button"
						onClick={() => void loadProject()}
						className="mt-3 text-sm font-medium underline"
					>
						Retry
					</button>
				</div>
			</main>
		);
	}
	return (
		<main className="mx-auto w-full max-w-5xl space-y-8 p-6 md:p-8">
			<div>
				<Link
					href="/projects"
					className="text-sm text-muted-foreground hover:text-foreground"
				>
					← Back to projects
				</Link>

				<div className="mt-5">
					<h1 className="text-2xl font-semibold">{project.name}</h1>

					<p className="mt-2 text-sm text-muted-foreground">
						Created {new Date(project.createdAt).toLocaleDateString()}
					</p>
				</div>
			</div>

			<section className="space-y-4">
				<div className="flex items-center justify-between gap-4">
					<div>
						<h2 className="text-lg font-semibold">Workspace directories</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Local folders registered with this project.
						</p>
					</div>

					<button
						type="button"
						onClick={() => void loadDirectories()}
						disabled={isDirectoriesLoading}
						className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
					>
						{isDirectoriesLoading ? 'Refreshing...' : 'Refresh'}
					</button>
				</div>

				{directoriesError ? (
					<div
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
					>
						<p className="text-sm">{directoriesError}</p>

						<button
							type="button"
							onClick={() => void loadDirectories()}
							className="mt-3 text-sm font-medium underline"
						>
							Retry
						</button>
					</div>
				) : isDirectoriesLoading ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						Loading workspace directories...
					</p>
				) : directories.length === 0 ? (
					<div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
						<h3 className="font-medium">No workspace directories</h3>
						<p className="mt-2 text-sm text-muted-foreground">
							Register a local folder to give this project access to its
							workspace files.
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{directories.map((directory) => (
							<article
								key={directory.id}
								className="rounded-xl border border-border bg-card p-4"
							>
								<h3 className="font-medium">{directory.name}</h3>
								<p className="mt-1 break-all font-mono text-xs text-muted-foreground">
									{directory.path}
								</p>
							</article>
						))}
					</div>
				)}
			</section>

			<section className="mt-8 space-y-4">
				<div className="flex items-center justify-between gap-4">
					<div>
						<h2 className="text-lg font-semibold">Conversations</h2>
						<p className="text-sm text-muted-foreground">
							Chat with your project context.
						</p>
					</div>
				</div>

				{isConversationsLoading ? (
					<p className="text-sm text-muted-foreground">
						Loading conversations...
					</p>
				) : conversationsError ? (
					<div role="alert" className="text-sm text-destructive">
						{conversationsError}
						<button
							type="button"
							onClick={() => void refreshConversations()}
							className="ml-2 underline underline-offset-4"
						>
							Retry
						</button>
					</div>
				) : conversations.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No conversations yet. Start your first project conversation below.
					</p>
				) : (
					<div className="space-y-1">
						{conversations.map((conversation) => (
							<button
								key={conversation.id}
								type="button"
								onClick={() => handleSelectConversation(conversation.id)}
								disabled={isGenerating}
								className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed ${
									activeConversationId === conversation.id
										? 'bg-accent font-medium'
										: ''
								}`}
							>
								<span className="block truncate">
									{conversation.title || 'New conversation'}
								</span>
								<span className="mt-1 block text-xs text-muted-foreground">
									{new Date(conversation.updatedAt).toLocaleString()}
								</span>
							</button>
						))}
					</div>
				)}
			</section>

			<section className="mt-8 flex h-162.5 min-h-0 flex-col overflow-hidden rounded-lg border">
				<header className="flex h-12 shrink-0 items-center border-b px-4">
					<h2 className="truncate text-sm font-medium">
						{title || 'New project conversation'}
					</h2>
				</header>

				<ChatContent
					messages={messages}
					isGenerating={isGenerating}
					isLoadingConversation={isLoadingConversation}
					loadError={loadError}
					clearLoadError={clearLoadError}
					sendMessage={sendMessage}
					stopGeneration={stopGeneration}
					editMessage={editMessage}
					regenerateMessage={regenerateMessage}
				/>
			</section>
		</main>
	);
}
