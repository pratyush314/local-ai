'use client';

import type { ReactNode } from 'react';

import { SidebarFooter } from './sidebar-footer';
import { ConversationSidebar } from '@/features/conversations/components/conversation-sidebar';

interface AppShellProps {
	children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
	const handleNewChat = () => {
		// Temporary until chat state is connected.
		window.location.href = '/';
	};

	return (
		<div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
			{/* Desktop sidebar */}
			<aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
				<div className="flex h-14 shrink-0 items-center border-b px-4">
					<span className="font-semibold tracking-tight">Local AI</span>
				</div>

				<div className="min-h-0 flex-1">
					<ConversationSidebar onNewChat={handleNewChat} />
				</div>

				<div className="border-t p-3">
					<SidebarFooter />
				</div>
			</aside>

			<main className="flex min-w-0 flex-1 flex-col">{children}</main>
		</div>
	);
}
