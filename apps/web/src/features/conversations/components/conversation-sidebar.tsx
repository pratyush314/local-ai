'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { useConversations } from '../hooks/use-conversations';
import { groupConversations } from '../utils/conversation-grouping';
import { NewChatButton } from './new-chat-button';
import { ConversationGroup } from './conversations-group';
import { useProjectsContext } from '@/features/projects/providers/projects-provider';

interface ConversationSidebarProps {
	activeConversationId?: string | null;
	refreshVersion?: number;
	onSelectConversation?: (conversationId: string) => void;
	onNewChat?: () => void;
	onDeleteConversation?: (conversationId: string) => void;
}

export function ConversationSidebar({
	activeConversationId = null,
	refreshVersion = 0,
	onSelectConversation,
	onNewChat,
	onDeleteConversation,
}: ConversationSidebarProps) {
	const { conversations, isLoading, error, removeConversation } =
		useConversations({ refreshVersion });

	const {
		projects,
		isLoading: isLoadingProjects,
		error: projectsError,
	} = useProjectsContext();

	const groups = useMemo(
		() => groupConversations(conversations),
		[conversations],
	);

	const handleDeleteConversation = async (conversationId: string) => {
		await removeConversation(conversationId);
		onDeleteConversation?.(conversationId);
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="p-3">
				<NewChatButton onClick={onNewChat} />
			</div>

			<div className="px-3 pb-3">
				<div className="mb-2 px-2 text-xs font-medium text-muted-foreground">
					Workspace
				</div>

				<Link
					href="/projects"
					className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="17"
						height="17"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
						<path d="M3 10h18" />
					</svg>
					<span>Projects</span>
				</Link>

				<div className="mt-2 space-y-1 pl-3">
					{isLoadingProjects && (
						<p className="px-2.5 py-1.5 text-xs text-muted-foreground">
							Loading projects...
						</p>
					)}

					{!isLoadingProjects && projectsError && (
						<p className="px-2.5 py-1.5 text-xs text-destructive">
							Unable to load projects.
						</p>
					)}

					{!isLoadingProjects &&
						!projectsError &&
						projects.map((project) => (
							<Link
								key={project.id}
								href={`/projects/${project.id}`}
								title={project.name}
								className="flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="15"
									height="15"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.8"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
									className="shrink-0"
								>
									<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
								</svg>
								<span className="truncate">{project.name}</span>
							</Link>
						))}

					{!isLoadingProjects && !projectsError && projects.length === 0 && (
						<p className="px-2.5 py-1.5 text-xs text-muted-foreground">
							No projects yet.
						</p>
					)}
				</div>
			</div>

			<div className="mx-3 border-t" />

			<div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-2">
				<div className="mb-2 px-2.5 text-xs font-medium text-muted-foreground">
					Recent conversations
				</div>

				{isLoading && (
					<div className="px-2.5 py-2 text-xs text-muted-foreground">
						Loading conversations...
					</div>
				)}

				{!isLoading && error && (
					<div className="px-2.5 py-2 text-xs text-destructive">
						Failed to load conversations.
					</div>
				)}

				{!isLoading && !error && conversations.length === 0 && (
					<div className="px-2.5 py-2 text-xs text-muted-foreground">
						No conversations yet.
					</div>
				)}

				{!isLoading &&
					!error &&
					groups.map((group) => (
						<ConversationGroup
							key={group.title}
							title={group.title}
							conversations={group.conversations}
							activeConversationId={activeConversationId}
							onSelect={onSelectConversation}
							handleDeleteConversation={handleDeleteConversation}
						/>
					))}
			</div>
		</div>
	);
}
