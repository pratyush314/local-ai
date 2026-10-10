'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

import type { ChatStreamProcessorHandlers } from '../lib/chat-stream';

import { useChatActions } from './use-chat-actions';
import { useChatConversation } from './use-chat-conversation';
import { useChatState } from './use-chat-state';
import { useChatStream } from './use-chat-stream';

export interface UseChatOptions {
	conversationId: string | null;
	onConversationChange: (conversationId: string) => void;
	onConversationUpdated: () => void;
}

export function useChat({
	conversationId,
	onConversationChange,
	onConversationUpdated,
}: UseChatOptions) {
	const chatState = useChatState();

	const [streamError, setStreamError] = useState<{
		conversationId: string | null;
		message: string;
	} | null>(null);

	const skipNextLoadRef = useRef<string | null>(null);

	const setSkipNextLoad = useCallback((conversationId: string) => {
		skipNextLoadRef.current = conversationId;
	}, []);

	const streamHandlers = useMemo<ChatStreamProcessorHandlers>(
		() => ({
			setConversation: chatState.setConversation,
			setTitle: chatState.setTitle,
			setGenerating: chatState.setGenerating,
			addMessage: chatState.addMessage,
			replaceMessageId: chatState.replaceMessageId,
			appendToken: chatState.appendToken,
			setMessageStatus: chatState.setMessageStatus,
			failStreamingMessages: chatState.failStreamingMessages,
			cancelStreamingMessages: chatState.cancelStreamingMessages,

			setLoadError: setStreamError,

			onConversationChange,
			onConversationUpdated,
			setSkipNextLoad,
		}),
		[
			chatState.setConversation,
			chatState.setTitle,
			chatState.setGenerating,
			chatState.addMessage,
			chatState.replaceMessageId,
			chatState.appendToken,
			chatState.setMessageStatus,
			chatState.failStreamingMessages,
			chatState.cancelStreamingMessages,
			onConversationChange,
			onConversationUpdated,
			setSkipNextLoad,
		],
	);

	const chatStream = useChatStream({
		handlers: streamHandlers,
	});

	const conversation = useChatConversation({
		conversationId,
		setConversationData: chatState.setConversationData,
		setConversation: chatState.setConversation,
		reset: chatState.reset,
		abortGeneration: chatStream.abortGeneration,
		skipNextLoadRef,
	});

	const stateActions = useMemo(
		() => ({
			addOptimisticUserMessage: chatState.addOptimisticUserMessage,
			setGenerating: chatState.setGenerating,
			truncateMessages: chatState.truncateMessages,
			editMessageLocally: chatState.editMessageLocally,
			cancelStreamingMessages: chatState.cancelStreamingMessages,
		}),
		[
			chatState.addOptimisticUserMessage,
			chatState.setGenerating,
			chatState.truncateMessages,
			chatState.editMessageLocally,
			chatState.cancelStreamingMessages,
		],
	);

	const streamActions = useMemo(
		() => ({
			startStream: chatStream.startStream,
			stopGeneration: chatStream.stopGeneration,
		}),
		[chatStream.startStream, chatStream.stopGeneration],
	);

	const actions = useChatActions({
		state: chatState.state,
		stateActions,
		streamActions,
	});

	const visibleState =
		chatState.state.conversationId === conversationId || !conversationId
			? chatState.state
			: {
					...chatState.state,
					conversationId,
					messages: [],
					title: 'New conversation',
					isGenerating: false,
				};

	const loadError = conversation.loadError ?? streamError;

	const clearLoadError = useCallback(() => {
		conversation.clearLoadError();
		setStreamError(null);
	}, [conversation]);

	return {
		conversationId: visibleState.conversationId,
		messages: visibleState.messages,
		title: visibleState.title,
		isGenerating: visibleState.isGenerating,
		isLoadingConversation: conversation.isLoadingConversation,
		loadError: loadError,
		clearLoadError: clearLoadError,
		sendMessage: actions.sendMessage,
		regenerateMessage: actions.regenerateMessage,
		editMessage: actions.editMessage,
		stopGeneration: actions.stopGeneration,
	};
}
