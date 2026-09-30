'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { continueChat, startChat } from '../lib/chat-api';
import type { ChatState } from '../types/chat.types';

const initialState: ChatState = {
	conversationId: null,
	messages: [],
	title: 'New conversation',
	isGenerating: false,
};

export function useChatStream() {
	const [state, setState] = useState<ChatState>(initialState);

	const abortControllerRef = useRef<AbortController | null>(null);

	const sendMessage = useCallback(
		async (content: string) => {
			if (!content.trim()) {
				return;
			}

			if (abortControllerRef.current) {
				return;
			}

			const controller = new AbortController();

			abortControllerRef.current = controller;

			const userMessageId = crypto.randomUUID();

			setState((current) => ({
				...current,
				isGenerating: true,
				messages: [
					...current.messages,
					{
						id: userMessageId,
						role: 'user',
						content,
						status: 'completed',
					},
				],
			}));

			try {
				const conversationId = state.conversationId;

				const stream = conversationId
					? continueChat(conversationId, { content }, controller.signal)
					: startChat({ content }, controller.signal);

				for await (const event of stream) {
					if (controller.signal.aborted) {
						break;
					}

					setState((current) => {
						switch (event.type) {
							case 'conversation':
								return {
									...current,
									conversationId: event.conversationId,
								};

							case 'message':
								if (event.role === 'user') {
									return current;
								}

								return {
									...current,
									messages: [
										...current.messages,
										{
											id: event.messageId,
											role: 'assistant',
											content: '',
											status: 'streaming',
										},
									],
								};

							case 'token':
								return {
									...current,
									messages: current.messages.map((message) =>
										message.role === 'assistant' &&
										message.status === 'streaming'
											? {
													...message,
													content: message.content + event.content,
												}
											: message,
									),
								};

							case 'done':
								return {
									...current,
									messages: current.messages.map((message) =>
										message.id === event.messageId
											? {
													...message,
													status: 'completed',
												}
											: message,
									),
									isGenerating: false,
								};

							case 'conversation_updated':
								return {
									...current,
									title: event.title,
								};

							case 'cancelled':
								return {
									...current,
									messages: current.messages.map((message) =>
										message.id === event.messageId
											? {
													...message,
													status: 'cancelled',
												}
											: message,
									),
									isGenerating: false,
								};

							case 'error':
								return {
									...current,
									messages: current.messages.map((message) =>
										message.status === 'streaming'
											? {
													...message,
													status: 'failed',
												}
											: message,
									),
									isGenerating: false,
								};

							default:
								return current;
						}
					});
				}
			} catch (error) {
				if (controller.signal.aborted) {
					return;
				}

				setState((current) => ({
					...current,
					messages: current.messages.map((message) =>
						message.status === 'streaming'
							? {
									...message,
									status: 'failed',
								}
							: message,
					),
					isGenerating: false,
				}));

				console.error('Chat stream failed:', error);
			} finally {
				abortControllerRef.current = null;

				setState((current) => ({
					...current,
					isGenerating: false,
				}));
			}
		},
		[state.conversationId],
	);

	const stopGeneration = useCallback(() => {
		abortControllerRef.current?.abort();
		abortControllerRef.current = null;

		setState((current) => ({
			...current,
			isGenerating: false,
			messages: current.messages.map((message) =>
				message.status === 'streaming'
					? {
							...message,
							status: 'cancelled',
						}
					: message,
			),
		}));
	}, []);

	const newChat = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}

		setState(initialState);
	}, []);

	useEffect(() => {
		return () => {
			abortControllerRef.current?.abort();
		};
	}, []);

	return {
		conversationId: state.conversationId,
		messages: state.messages,
		title: state.title,
		isGenerating: state.isGenerating,
		sendMessage,
		stopGeneration,
		newChat,
	};
}
