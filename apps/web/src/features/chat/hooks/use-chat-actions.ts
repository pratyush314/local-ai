'use client';

import { useCallback } from 'react';

import type { ChatStreamEvent } from '@local-ai/contracts/chat';

import {
	continueChat,
	editMessage as editChatMessage,
	regenerateMessage as regenerateChatMessage,
	startChat,
} from '../lib/chat-api';

import type { ChatMessage, ChatState } from '../types/chat.types';

interface ChatStateActions {
	addOptimisticUserMessage: (content: string) => ChatMessage;
	setGenerating: (isGenerating: boolean) => void;
	truncateMessages: (messageCount: number) => void;
	editMessageLocally: (messageId: string, content: string) => void;
	cancelStreamingMessages: () => void;
}

interface ChatStreamActions {
	startStream: (
		stream: AsyncGenerator<ChatStreamEvent>,
		activeConversationId: string | null,
		pendingUserMessageId?: string,
	) => Promise<void>;
	stopGeneration: () => void;
}

interface UseChatActionsOptions {
	state: ChatState;
	stateActions: ChatStateActions;
	streamActions: ChatStreamActions;
}

export function useChatActions({
	state,
	stateActions,
	streamActions,
}: UseChatActionsOptions) {
	const sendMessage = useCallback(
		async (content: string) => {
			const normalizedContent = content.trim();

			if (!normalizedContent || state.isGenerating) {
				return;
			}

			const optimisticMessage =
				stateActions.addOptimisticUserMessage(normalizedContent);

			stateActions.setGenerating(true);

			try {
				const stream = state.conversationId
					? continueChat(state.conversationId, {
							content: normalizedContent,
						})
					: startChat({
							content: normalizedContent,
						});

				await streamActions.startStream(
					stream,
					state.conversationId,
					optimisticMessage.id,
				);
			} catch {
				stateActions.setGenerating(false);
			}
		},
		[state.conversationId, state.isGenerating, stateActions, streamActions],
	);

	const regenerateMessage = useCallback(
		async (messageId: string) => {
			if (state.isGenerating || !state.conversationId) {
				return;
			}

			const messageIndex = state.messages.findIndex(
				(message) => message.id === messageId,
			);

			if (messageIndex < 1) {
				return;
			}

			const message = state.messages[messageIndex];
			const precedingMessage = state.messages[messageIndex - 1];

			if (message.role !== 'assistant' || precedingMessage.role !== 'user') {
				return;
			}

			stateActions.truncateMessages(messageIndex);
			stateActions.setGenerating(true);

			try {
				const stream = regenerateChatMessage(state.conversationId, messageId);

				await streamActions.startStream(stream, state.conversationId);
			} catch {
				stateActions.setGenerating(false);
			}
		},
		[
			state.conversationId,
			state.isGenerating,
			state.messages,
			stateActions,
			streamActions,
		],
	);

	const editMessage = useCallback(
		async (messageId: string, content: string) => {
			const normalizedContent = content.trim();

			if (!normalizedContent || state.isGenerating || !state.conversationId) {
				return;
			}

			const message = state.messages.find((item) => item.id === messageId);

			if (!message || message.role !== 'user') {
				return;
			}

			// Update the displayed message immediately.
			stateActions.editMessageLocally(messageId, normalizedContent);

			// Keep the global generation state active while the AI responds.
			stateActions.setGenerating(true);

			try {
				const stream = editChatMessage(state.conversationId, messageId, {
					content: normalizedContent,
				});

				// Start consuming the stream in the background.
				// Do not wait here for the assistant response to finish.
				void streamActions
					.startStream(stream, state.conversationId)
					.catch(() => {
						stateActions.setGenerating(false);
					});
			} catch {
				stateActions.setGenerating(false);
			}
		},
		[
			state.conversationId,
			state.isGenerating,
			state.messages,
			stateActions,
			streamActions,
		],
	);

	const stopGeneration = useCallback(() => {
		streamActions.stopGeneration();
		stateActions.cancelStreamingMessages();
		stateActions.setGenerating(false);
	}, [streamActions, stateActions]);

	return {
		sendMessage,
		regenerateMessage,
		editMessage,
		stopGeneration,
	};
}
