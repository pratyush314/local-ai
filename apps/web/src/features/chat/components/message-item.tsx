'use client';

import { Bot, User } from 'lucide-react';

import { cn } from '@/lib/utils';

import { MessageContent } from './message-content';
import type { ChatMessage } from '../types/chat.types';

interface MessageItemProps {
	message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
	const isUser = message.role === 'user';
	const isStreaming = message.status === 'streaming';
	const isFailed = message.status === 'failed';
	const isCancelled = message.status === 'cancelled';

	return (
		<article className={cn('group w-full', isUser ? 'py-3' : 'py-5')}>
			<div className="mx-auto flex w-full max-w-3xl gap-3 px-4">
				<div
					className={cn(
						'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border',
						isUser ? 'bg-muted' : 'bg-background',
					)}
				>
					{isUser ? (
						<User className="size-3.5" />
					) : (
						<Bot className="size-3.5" />
					)}
				</div>

				<div className="min-w-0 flex-1">
					<div className="mb-1 text-xs font-medium text-muted-foreground">
						{isUser ? 'You' : 'Local AI'}
					</div>

					{message.content ? (
						<MessageContent
							content={message.content}
							isStreaming={isStreaming}
						/>
					) : isStreaming ? (
						<TypingIndicator />
					) : null}

					{isFailed && (
						<p className="mt-2 text-sm text-destructive">
							Failed to generate a response.
						</p>
					)}

					{isCancelled && (
						<p className="mt-2 text-xs text-muted-foreground">
							Generation stopped.
						</p>
					)}
				</div>
			</div>
		</article>
	);
}

function TypingIndicator() {
	return (
		<div className="flex items-center gap-1 py-2">
			<span className="size-1.5 animate-pulse rounded-full bg-current" />
			<span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
			<span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
		</div>
	);
}
