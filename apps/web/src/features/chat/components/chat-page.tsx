'use client';

import { useCallback } from 'react';

import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import { useAppShell } from '@/components/layout/app-shell-context';

import { useChatStream } from '../hooks/use-chat-stream';
import { ChatInput } from './chat-input';
import { MessageList } from './message-list';

export function ChatPage() {
	const {
		activeConversationId,
		selectConversation,
		startNewChat,
		markConversationsChanged,
	} = useAppShell();

	const handleConversationChange = useCallback(
		(conversationId: string) => {
			selectConversation(conversationId);
		},
		[selectConversation],
	);

	const handleConversationUpdated = useCallback(() => {
		markConversationsChanged();
	}, [markConversationsChanged]);

	const {
		messages,
		title,
		isGenerating,
		isLoadingConversation,
		loadError,
		sendMessage,
		stopGeneration,
	} = useChatStream({
		conversationId: activeConversationId,
		onConversationChange: handleConversationChange,
		onConversationUpdated: handleConversationUpdated,
	});

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="flex h-14 shrink-0 items-center border-b px-3 md:px-4">
				<div className="flex min-w-0 items-center gap-2">
					<div className="md:hidden">
						<MobileSidebar onNewChat={startNewChat} />
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
					<MessageList messages={messages} />
				)}

				{loadError && (
					<p className="px-4 py-2 text-center text-sm text-destructive">
						{loadError}
					</p>
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
