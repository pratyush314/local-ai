'use client';

import { useCallback, type ReactNode } from 'react';

import { ConversationSidebar } from '@/features/conversations/components/conversation-sidebar';

import { AppShellProvider, useAppShell } from './app-shell-context';
import { SidebarFooter } from './sidebar-footer';

interface AppShellProps {
	children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	return (
		<AppShellProvider>
			<AppShellContent>{children}</AppShellContent>
		</AppShellProvider>
	);
}

function AppShellContent({ children }: AppShellProps) {
	const {
		activeConversationId,
		refreshVersion,
		selectConversation,
		startNewChat,
	} = useAppShell();

	const handleDeleteConversation = useCallback(
		(conversationId: string) => {
			if (activeConversationId === conversationId) {
				startNewChat();
			}
		},
		[activeConversationId, startNewChat],
	);

	return (
		<div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
			<aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
				<div className="flex h-14 shrink-0 items-center border-b px-4">
					<span className="font-semibold tracking-tight">Local AI</span>
				</div>

				<div className="min-h-0 flex-1">
					<ConversationSidebar
						activeConversationId={activeConversationId}
						refreshVersion={refreshVersion}
						onSelectConversation={selectConversation}
						onNewChat={startNewChat}
						onDeleteConversation={handleDeleteConversation}
					/>
				</div>

				<div className="border-t p-3">
					<SidebarFooter />
				</div>
			</aside>

			<main className="flex min-w-0 flex-1 flex-col">{children}</main>
		</div>
	);
}
