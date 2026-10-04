'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { MESSAGE_STATUS } from '@local-ai/constants/chat';

import {
	getConversation,
	getConversationMessages,
} from '@/features/conversations/lib/conversation-api';

import { continueChat, startChat } from '../lib/chat-api';
import type { ChatMessage, ChatState } from '../types/chat.types';

const initialState: ChatState = {
	conversationId: null,
	messages: [],
	title: 'New conversation',
	isGenerating: false,
};

interface UseChatStreamOptions {
	conversationId: string | null;
	onConversationChange: (conversationId: string) => void;
	onConversationUpdated: () => void;
}

export function useChatStream({
	conversationId,
	onConversationChange,
	onConversationUpdated,
}: UseChatStreamOptions) {
	const [state, setState] = useState<ChatState>(initialState);

	const [loadErrorState, setLoadErrorState] = useState<{
		conversationId: string | null;
		message: string;
	} | null>(null);

	const abortControllerRef = useRef<AbortController | null>(null);

	/**
	 * Every conversation load / generation gets its own run ID.
	 *
	 * If the user switches conversations while a request is still running,
	 * the old request can finish later, but its result will be ignored.
	 */
	const runIdRef = useRef(0);

	/**
	 * When a new conversation is created through POST /chat,
	 * the backend sends a `conversation` SSE event.
	 *
	 * AppShell then updates activeConversationId.
	 *
	 * We already have the conversation data in memory at that point,
	 * so we don't need to immediately GET the conversation again.
	 */
	const skipNextLoadRef = useRef<string | null>(null);

	/**
	 * The state currently belongs to the selected conversation.
	 *
	 * When the selected conversation changes, the old state must not
	 * temporarily appear while the new conversation is loading.
	 */
	const visibleState =
		state.conversationId === conversationId
			? state
			: {
					...initialState,
					conversationId,
				};

	/**
	 * Loading is derived from the selected conversation instead of being
	 * synchronously toggled inside the effect.
	 *
	 * This avoids React's set-state-in-effect warning.
	 */
	const isLoadingConversation =
		conversationId !== null &&
		state.conversationId !== conversationId &&
		loadErrorState?.conversationId !== conversationId;

	const loadError =
		loadErrorState?.conversationId === conversationId
			? loadErrorState.message
			: null;

	/**
	 * Load a selected conversation.
	 *
	 * This effect only calls setState from asynchronous callbacks.
	 * It does not synchronously update state when the effect starts.
	 */
	useEffect(() => {
		/**
		 * A newly created conversation already exists in our local state
		 * because it came from the active streaming request.
		 *
		 * Therefore, skip the GET request triggered by AppShell changing
		 * activeConversationId.
		 */
		if (conversationId && skipNextLoadRef.current === conversationId) {
			skipNextLoadRef.current = null;
			return;
		}

		const runId = ++runIdRef.current;

		/**
		 * Abort any active generation before loading another conversation.
		 */
		abortControllerRef.current?.abort();
		abortControllerRef.current = null;

		if (!conversationId) {
			return;
		}

		void Promise.all([
			getConversation(conversationId),
			getConversationMessages(conversationId),
		])
			.then(([conversation, messages]) => {
				/**
				 * Ignore results from an old conversation.
				 */
				if (runId !== runIdRef.current) {
					return;
				}

				setState({
					conversationId: conversation.id,
					title: conversation.title,
					isGenerating: false,

					messages: messages.map<ChatMessage>((message) => ({
						id: message.id,
						role: message.role,
						content: message.content,
						status: message.status,
					})),
				});

				setLoadErrorState(null);
			})
			.catch((error: unknown) => {
				/**
				 * Ignore errors from an old conversation.
				 */
				if (runId !== runIdRef.current) {
					return;
				}

				setLoadErrorState({
					conversationId,
					message:
						error instanceof Error
							? error.message
							: 'Failed to load conversation',
				});
			});
	}, [conversationId]);

	/**
	 * Send a new user message.
	 */
	const sendMessage = useCallback(
		async (content: string) => {
			if (!content.trim()) {
				return;
			}

			/**
			 * Don't allow multiple simultaneous generations
			 * for the same client instance.
			 */
			if (abortControllerRef.current) {
				return;
			}

			/**
			 * Don't send a message while an existing conversation
			 * is still being loaded.
			 */
			if (isLoadingConversation) {
				return;
			}

			const controller = new AbortController();

			/**
			 * This generation gets a unique run ID.
			 */
			const runId = ++runIdRef.current;

			abortControllerRef.current = controller;

			setLoadErrorState(null);

			/**
			 * Optimistically add the user message to the UI.
			 */
			setState((current) => ({
				...current,

				isGenerating: true,

				messages: [
					...current.messages,

					{
						id: crypto.randomUUID(),
						role: 'user',
						content,
						status: MESSAGE_STATUS.COMPLETED,
					},
				],
			}));

			try {
				const stream = conversationId
					? continueChat(conversationId, { content }, controller.signal)
					: startChat({ content }, controller.signal);

				for await (const event of stream) {
					/**
					 * Ignore events after cancellation or after
					 * switching to another conversation.
					 */
					if (controller.signal.aborted || runId !== runIdRef.current) {
						break;
					}

					switch (event.type) {
						/**
						 * New conversation created.
						 */
						case 'conversation': {
							/**
							 * The conversation was created by the
							 * current stream, so don't immediately
							 * GET it again.
							 */
							skipNextLoadRef.current = event.conversationId;

							setState((current) => ({
								...current,
								conversationId: event.conversationId,
							}));

							/**
							 * Update AppShell's selected conversation.
							 */
							onConversationChange(event.conversationId);

							/**
							 * Refresh the sidebar so the newly
							 * created conversation appears.
							 */
							onConversationUpdated();

							break;
						}

						/**
						 * Message record created.
						 */
						case 'message': {
							/**
							 * We already optimistically rendered
							 * the user message.
							 */
							if (event.role === 'user') {
								break;
							}

							/**
							 * Create the assistant placeholder.
							 */
							setState((current) => ({
								...current,

								messages: [
									...current.messages,

									{
										id: event.messageId,
										role: 'assistant',
										content: '',
										status: MESSAGE_STATUS.STREAMING,
									},
								],
							}));

							break;
						}

						/**
						 * Assistant token received.
						 */
						case 'token': {
							setState((current) => ({
								...current,

								messages: current.messages.map((message) =>
									message.role === 'assistant' &&
									message.status === MESSAGE_STATUS.STREAMING
										? {
												...message,
												content: message.content + event.content,
											}
										: message,
								),
							}));

							break;
						}

						/**
						 * Assistant response completed.
						 */
						case 'done': {
							setState((current) => ({
								...current,

								messages: current.messages.map((message) =>
									message.id === event.messageId
										? {
												...message,
												status: MESSAGE_STATUS.COMPLETED,
											}
										: message,
								),

								isGenerating: false,
							}));

							/**
							 * The conversation's updatedAt changed,
							 * so refresh the sidebar ordering.
							 */
							onConversationUpdated();

							break;
						}

						/**
						 * Conversation title generated.
						 */
						case 'conversation_updated': {
							setState((current) => ({
								...current,
								title: event.title,
							}));

							/**
							 * Refresh sidebar so the new title
							 * appears there too.
							 */
							onConversationUpdated();

							break;
						}

						/**
						 * Generation cancelled.
						 */
						case 'cancelled': {
							setState((current) => ({
								...current,

								messages: current.messages.map((message) =>
									message.id === event.messageId
										? {
												...message,
												status: MESSAGE_STATUS.CANCELLED,
											}
										: message,
								),

								isGenerating: false,
							}));

							break;
						}

						/**
						 * Backend reported a generation error.
						 */
						case 'error': {
							setLoadErrorState({
								conversationId,
								message: event.message,
							});

							setState((current) => ({
								...current,

								messages: current.messages.map((message) =>
									message.status === MESSAGE_STATUS.STREAMING
										? {
												...message,
												status: MESSAGE_STATUS.FAILED,
											}
										: message,
								),

								isGenerating: false,
							}));

							break;
						}
					}
				}
			} catch (error: unknown) {
				/**
				 * Abort errors are expected when the user presses
				 * Stop or switches conversations.
				 */
				if (controller.signal.aborted || runId !== runIdRef.current) {
					return;
				}

				setLoadErrorState({
					conversationId,
					message:
						error instanceof Error ? error.message : 'Chat generation failed',
				});

				setState((current) => ({
					...current,

					messages: current.messages.map((message) =>
						message.status === MESSAGE_STATUS.STREAMING
							? {
									...message,
									status: MESSAGE_STATUS.FAILED,
								}
							: message,
					),

					isGenerating: false,
				}));
			} finally {
				/**
				 * Only clear the controller if it still belongs
				 * to this generation.
				 */
				if (abortControllerRef.current === controller) {
					abortControllerRef.current = null;
				}

				/**
				 * Don't update the new conversation's state from
				 * an old generation.
				 */
				if (runId === runIdRef.current) {
					setState((current) => ({
						...current,
						isGenerating: false,
					}));
				}
			}
		},
		[
			conversationId,
			isLoadingConversation,
			onConversationChange,
			onConversationUpdated,
		],
	);

	/**
	 * Stop the current generation.
	 */
	const stopGeneration = useCallback(() => {
		const controller = abortControllerRef.current;

		if (!controller) {
			return;
		}

		/**
		 * Invalidate the current generation before aborting it.
		 * This guarantees late events won't update state.
		 */
		++runIdRef.current;

		abortControllerRef.current = null;

		controller.abort();

		setState((current) => ({
			...current,

			isGenerating: false,

			messages: current.messages.map((message) =>
				message.status === MESSAGE_STATUS.STREAMING
					? {
							...message,
							status: MESSAGE_STATUS.CANCELLED,
						}
					: message,
			),
		}));
	}, []);

	/**
	 * Reset the current chat locally.
	 *
	 * AppShell is responsible for setting activeConversationId
	 * to null. This function only resets the hook's local state.
	 */
	const newChat = useCallback(() => {
		++runIdRef.current;

		abortControllerRef.current?.abort();
		abortControllerRef.current = null;

		skipNextLoadRef.current = null;

		setLoadErrorState(null);

		setState(initialState);
	}, []);

	/**
	 * Cleanup when ChatPage unmounts.
	 */
	useEffect(() => {
		return () => {
			++runIdRef.current;

			abortControllerRef.current?.abort();

			abortControllerRef.current = null;
		};
	}, []);

	return {
		conversationId: visibleState.conversationId,
		messages: visibleState.messages,
		title: visibleState.title,
		isGenerating: visibleState.isGenerating,

		isLoadingConversation,

		loadError,

		sendMessage,
		stopGeneration,
		newChat,
	};
}
