'use client';

import { MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { Conversation } from '../types/conversation.types';

interface ConversationItemProps {
	conversation: Conversation;
	active?: boolean;
	onClick?: () => void;
}

export function ConversationItem({
	conversation,
	active = false,
	onClick,
}: ConversationItemProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
				'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
				active && 'bg-sidebar-accent text-sidebar-accent-foreground',
			)}
		>
			<MessageSquare className="size-4 shrink-0 text-muted-foreground" />

			<span className="min-w-0 flex-1 truncate">{conversation.title}</span>
		</button>
	);
}
