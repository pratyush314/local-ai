'use client';

import { useEffect, useState } from 'react';
import { Bot, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ChatMessage } from '../../types/chat.types';
import { MessageActions } from './message-actions';
import { MessageContent } from './message-content';

interface MessageItemProps {
	message: ChatMessage;
	isGenerating: boolean;
	onEditMessage: (messageId: string, content: string) => void | Promise<void>;
	onRegenerateMessage: (messageId: string) => void | Promise<void>;
}

export function MessageItem({
	message,
	isGenerating,
	onEditMessage,
	onRegenerateMessage,
}: MessageItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedContent, setEditedContent] = useState(message.content);
	const [isSaving, setIsSaving] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const isUser = message.role === 'user';
	const isStreaming = message.status === 'streaming';
	const isCompleted = message.status === 'completed';
	const isFailed = message.status === 'failed';
	const isCancelled = message.status === 'cancelled';
	const actionsDisabled = isGenerating || isSaving;

	useEffect(() => {
		const setEditedCnt = () => {
			setEditedContent(message.content);
		};
		if (!isEditing) {
			setEditedCnt();
		}
	}, [message.content, isEditing]);

	const handleEdit = () => {
		setEditedContent(message.content);
		setActionError(null);
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		setEditedContent(message.content);
		setActionError(null);
		setIsEditing(false);
	};

	const handleSaveEdit = async () => {
		const content = editedContent.trim();

		if (!content || content === message.content.trim() || actionsDisabled) {
			if (content === message.content.trim()) {
				setIsEditing(false);
			}
			return;
		}

		setIsSaving(true);
		setActionError(null);

		try {
			await onEditMessage(message.id, content);
			setIsEditing(false);
		} catch (error) {
			setActionError(
				error instanceof Error ? error.message : 'Failed to edit message.',
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleRegenerate = async () => {
		setActionError(null);

		try {
			await onRegenerateMessage(message.id);
		} catch (error) {
			setActionError(
				error instanceof Error
					? error.message
					: 'Failed to regenerate response.',
			);
		}
	};

	if (isUser) {
		return (
			<article className="group w-full py-4">
				<div className="mx-auto flex w-full max-w-4xl justify-end px-4">
					<div className="flex max-w-[80%] flex-col items-end">
						{isEditing ? (
							<div className="w-full min-w-[min(70vw,20rem)] space-y-2">
								<textarea
									value={editedContent}
									onChange={(event) => setEditedContent(event.target.value)}
									disabled={isSaving}
									autoFocus
									aria-label="Edit your message"
									className="min-h-28 w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
									onKeyDown={(event) => {
										if (
											event.key === 'Enter' &&
											(event.ctrlKey || event.metaKey)
										) {
											event.preventDefault();
											void handleSaveEdit();
										}

										if (event.key === 'Escape') {
											handleCancelEdit();
										}
									}}
								/>

								<div className="flex items-center justify-end gap-2">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-8 gap-1.5"
										onClick={handleCancelEdit}
										disabled={isSaving}
									>
										<X className="size-3.5" />
										Cancel
									</Button>

									<Button
										type="button"
										size="sm"
										className="h-8 gap-1.5"
										onClick={() => void handleSaveEdit()}
										disabled={
											isSaving ||
											!editedContent.trim() ||
											editedContent.trim() === message.content.trim()
										}
									>
										<Check className="size-3.5" />
										{isSaving ? 'Saving...' : 'Save and submit'}
									</Button>
								</div>

								<p className="text-right text-xs text-muted-foreground">
									Ctrl+Enter to submit · Esc to cancel
								</p>
							</div>
						) : (
							<>
								<div
									className={cn(
										'rounded-2xl rounded-br-md px-4 py-3',
										'bg-(--user-message) text-foreground',
									)}
								>
									<MessageContent content={message.content} />
								</div>

								{isCompleted && (
									<MessageActions
										content={message.content}
										onEdit={handleEdit}
										disabled={actionsDisabled}
									/>
								)}
							</>
						)}

						{actionError && (
							<p role="alert" className="mt-2 text-sm text-destructive">
								{actionError}
							</p>
						)}
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

					{actionError && (
						<p role="alert" className="mt-2 text-sm text-destructive">
							{actionError}
						</p>
					)}

					{message.content && isCompleted && (
						<MessageActions
							content={message.content}
							onRegenerate={() => void handleRegenerate()}
							disabled={actionsDisabled}
						/>
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
