'use client';

import { useState } from 'react';

import { ConversationItem } from './conversation-item';
import { NewChatButton } from './new-chat-button';
import { mockConversations } from '../lib/mock-conversations';

interface ConversationSidebarProps {
	onNewChat?: () => void;
}

export function ConversationSidebar({ onNewChat }: ConversationSidebarProps) {
	const [activeConversationId, setActiveConversationId] = useState<
		string | null
	>(null);

	const today = mockConversations.filter(
		(conversation) => conversation.updatedAt === 'Today',
	);

	const yesterday = mockConversations.filter(
		(conversation) => conversation.updatedAt === 'Yesterday',
	);

	const previous = mockConversations.filter(
		(conversation) => conversation.updatedAt === 'Previous 7 days',
	);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="p-3">
				<NewChatButton onClick={onNewChat} />
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
				{today.length > 0 && (
					<ConversationGroup
						title="Today"
						conversations={today}
						activeConversationId={activeConversationId}
						onSelect={setActiveConversationId}
					/>
				)}

				{yesterday.length > 0 && (
					<ConversationGroup
						title="Yesterday"
						conversations={yesterday}
						activeConversationId={activeConversationId}
						onSelect={setActiveConversationId}
					/>
				)}

				{previous.length > 0 && (
					<ConversationGroup
						title="Previous 7 days"
						conversations={previous}
						activeConversationId={activeConversationId}
						onSelect={setActiveConversationId}
					/>
				)}
			</div>
		</div>
	);
}

interface ConversationGroupProps {
	title: string;
	conversations: typeof mockConversations;
	activeConversationId: string | null;
	onSelect: (id: string) => void;
}

function ConversationGroup({
	title,
	conversations,
	activeConversationId,
	onSelect,
}: ConversationGroupProps) {
	return (
		<section className="mb-5">
			<h2 className="mb-1 px-2.5 text-xs font-medium text-muted-foreground">
				{title}
			</h2>

			<div className="space-y-0.5">
				{conversations.map((conversation) => (
					<ConversationItem
						key={conversation.id}
						conversation={conversation}
						active={activeConversationId === conversation.id}
						onClick={() => onSelect(conversation.id)}
					/>
				))}
			</div>
		</section>
	);
}
