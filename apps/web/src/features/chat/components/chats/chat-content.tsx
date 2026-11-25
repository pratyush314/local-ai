'use client';

import { MessageList } from '../messages/message-list';
import { ChatInput } from './chat-input';

interface ChatContentProps {
	messages: Parameters<typeof MessageList>[0]['messages'];
	isGenerating: boolean;
	isLoadingConversation: boolean;
	loadError: { message: string } | null;
	clearLoadError: () => void;
	sendMessage: (content: string) => void;
	stopGeneration: () => void;
	editMessage: Parameters<typeof MessageList>[0]['onEditMessage'];
	regenerateMessage: Parameters<typeof MessageList>[0]['onRegenerateMessage'];
}

export function ChatContent({
	messages,
	isGenerating,
	isLoadingConversation,
	loadError,
	clearLoadError,
	sendMessage,
	stopGeneration,
	editMessage,
	regenerateMessage,
}: ChatContentProps) {
	return (
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
	);
}
