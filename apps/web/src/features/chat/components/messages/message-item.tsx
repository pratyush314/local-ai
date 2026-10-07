'use client';

import { Bot } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ChatMessage } from '../../types/chat.types';
import { MessageActions } from './message-actions';
import { MessageContent } from './message-content';

interface MessageItemProps {
	message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
	const isUser = message.role === 'user';
	const isStreaming = message.status === 'streaming';
	const isFailed = message.status === 'failed';
	const isCancelled = message.status === 'cancelled';

	if (isUser) {
		return (
			<article className="group w-full py-4">
				<div className="mx-auto flex w-full max-w-4xl justify-end px-4">
					<div className="flex max-w-[80%] flex-col items-end">
						<div
							className={cn(
								'rounded-2xl rounded-br-md px-4 py-3',
								'bg-(--user-message) text-foreground',
							)}
						>
							<MessageContent content={message.content} />
						</div>

						<MessageActions content={message.content} />
					</div>
				</div>
			</article>
		);
	}

	return (
		<article className="group w-full py-6">
			<div className="mx-auto flex w-full max-w-4xl gap-3 px-4">
				<div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
					<Bot className="size-3.5" />
				</div>

				<div className="min-w-0 flex-1">
					<div className="mb-1.5 text-sm font-medium text-muted-foreground">
						Local AI
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

					{message.content && !isStreaming && (
						<MessageActions content={message.content} />
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
