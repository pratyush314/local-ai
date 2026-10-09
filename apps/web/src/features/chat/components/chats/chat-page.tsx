'use client';

import { useCallback } from 'react';

import { useAppShell } from '@/components/layout/app-shell-context';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';

import { useChat } from '../../hooks/use-chat';
import { ChatInput } from './chat-input';
import { MessageList } from '../messages/message-list';

export function ChatPage() {
	const { activeConversationId, selectConversation, markConversationsChanged } =
		useAppShell();

	const handleConversationUpdated = useCallback(() => {
		markConversationsChanged();
	}, [markConversationsChanged]);

	const {
		messages,
		title,
		isGenerating,
		isLoadingConversation,
		loadError,
		clearLoadError,
		sendMessage,
		stopGeneration,
		editMessage,
		regenerateMessage,
	} = useChat({
		conversationId: activeConversationId,
		onConversationChange: selectConversation,
		onConversationUpdated: handleConversationUpdated,
	});

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="flex h-14 shrink-0 items-center border-b px-3 md:px-4">
				<div className="flex min-w-0 items-center gap-2">
					<div className="md:hidden">
						<MobileSidebar />
					</div>

					<div className="min-w-0">
						<h1 className="truncate text-sm font-medium">{title}</h1>
					</div>
				</div>
			</header>

			<div className="flex min-h-0 flex-1 flex-col">
				{isLoadingConversation ? (
					<div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
						Loading conversation...
					</div>
				) : messages.length === 0 ? (
					<div className="flex flex-1 items-center justify-center px-4">
						<div className="w-full max-w-2xl text-center">
							<h2 className="text-2xl font-semibold tracking-tight">
								Start a conversation
							</h2>

							<p className="mt-2 text-sm text-muted-foreground">
								Ask anything. Your conversation stays on your local machine.
							</p>
						</div>
					</div>
				) : (
					<MessageList
						isGenerating={isGenerating}
						messages={messages}
						onEditMessage={editMessage}
						onRegenerateMessage={regenerateMessage}
					/>
				)}

				{loadError && (
					<div
						role="alert"
						className="flex items-center justify-center gap-3 px-4 py-2 text-center text-sm text-destructive"
					>
						<p>{loadError.message}</p>

						<button
							type="button"
							className="shrink-0 underline underline-offset-4"
							onClick={clearLoadError}
						>
							Dismiss
						</button>
					</div>
				)}

				<ChatInput
					onSend={sendMessage}
					onStop={stopGeneration}
					isGenerating={isGenerating}
				/>
			</div>
		</div>
	);
}
