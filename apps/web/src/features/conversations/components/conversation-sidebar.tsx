'use client';

import { useMemo } from 'react';

import { useConversations } from '../hooks/use-conversations';
import { groupConversations } from '../utils/conversation-grouping';
import { NewChatButton } from './new-chat-button';
import { ConversationGroup } from './conversations-group';

interface ConversationSidebarProps {
	activeConversationId?: string | null;
	refreshVersion?: number;
	onSelectConversation?: (conversationId: string) => void;
	onNewChat?: () => void;
}
export function ConversationSidebar({
	activeConversationId = null,
	refreshVersion = 0,
	onSelectConversation,
	onNewChat,
}: ConversationSidebarProps) {
	const { conversations, isLoading, error } = useConversations({
		refreshVersion,
	});

	const groups = useMemo(
		() => groupConversations(conversations),
		[conversations],
	);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="p-3">
				<NewChatButton onClick={onNewChat} />
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
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
						/>
					))}
			</div>
		</div>
	);
}
