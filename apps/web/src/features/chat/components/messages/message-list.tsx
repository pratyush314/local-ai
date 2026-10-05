'use client';

import { useEffect, useRef } from 'react';

import { MessageItem } from './message-item';
import type { ChatMessage } from '../../types/chat.types';

interface MessageListProps {
	messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({
			behavior: 'smooth',
			block: 'end',
		});
	}, [messages]);

	if (messages.length === 0) {
		return null;
	}

	return (
		<div className="min-h-0 flex-1 overflow-y-auto">
			<div className="pb-8 pt-4">
				{messages.map((message) => (
					<MessageItem key={message.id} message={message} />
				))}

				<div ref={bottomRef} />
			</div>
		</div>
	);
}
