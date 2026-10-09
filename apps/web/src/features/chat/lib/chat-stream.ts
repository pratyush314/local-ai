import { MESSAGE_STATUS } from '@local-ai/constants/chat';
import type { ChatStreamEvent } from '@local-ai/contracts/chat';

import type { ChatMessage } from '../types/chat.types';

export interface ChatStreamProcessorHandlers {
	setConversation: (conversationId: string) => void;
	setTitle: (title: string) => void;
	setGenerating: (isGenerating: boolean) => void;

	addMessage: (message: ChatMessage) => void;
	replaceMessageId: (currentMessageId: string, nextMessageId: string) => void;
	appendToken: (messageId: string, content: string) => void;
	setMessageStatus: (messageId: string, status: ChatMessage['status']) => void;
	failStreamingMessages: () => void;

	setLoadError: (
		error: { conversationId: string | null; message: string } | null,
	) => void;

	onConversationChange: (conversationId: string) => void;
	onConversationUpdated: () => void;
	setSkipNextLoad: (conversationId: string) => void;
}

export interface ProcessChatStreamOptions {
	stream: AsyncGenerator<ChatStreamEvent>;
	controller: AbortController;
	runId: number;
	activeConversationId: string | null;
	currentRunId: () => number;

	handlers: ChatStreamProcessorHandlers;

	pendingUserMessageId?: string;
}

export async function processChatStream({
	stream,
	controller,
	runId,
	activeConversationId,
	currentRunId,
	handlers,
	pendingUserMessageId,
}: ProcessChatStreamOptions): Promise<void> {
	let currentConversationId = activeConversationId;

	for await (const event of stream) {
		if (controller.signal.aborted || runId !== currentRunId()) {
			break;
		}

		switch (event.type) {
			case 'conversation': {
				currentConversationId = event.conversationId;

				handlers.setSkipNextLoad(event.conversationId);
				handlers.setConversation(event.conversationId);
				handlers.onConversationChange(event.conversationId);
				handlers.onConversationUpdated();

				break;
			}

			case 'message': {
				if (event.role === 'user') {
					if (pendingUserMessageId) {
						handlers.replaceMessageId(pendingUserMessageId, event.messageId);
					}

					break;
				}

				handlers.addMessage({
					id: event.messageId,
					role: 'assistant',
					content: '',
					status: MESSAGE_STATUS.STREAMING,
				});

				break;
			}

			case 'token': {
				handlers.appendToken(event.messageId, event.content);

				break;
			}

			case 'done': {
				handlers.setMessageStatus(event.messageId, MESSAGE_STATUS.COMPLETED);

				handlers.setGenerating(false);
				handlers.onConversationUpdated();

				break;
			}

			case 'conversation_updated': {
				handlers.setTitle(event.title);
				handlers.onConversationUpdated();

				break;
			}

			case 'cancelled': {
				handlers.setMessageStatus(event.messageId, MESSAGE_STATUS.CANCELLED);

				handlers.setGenerating(false);

				break;
			}

			case 'error':
				handlers.setLoadError({
					conversationId: currentConversationId,
					message: event.message,
				});
				handlers.failStreamingMessages();
				handlers.setGenerating(false);
				break;
		}
	}
}
