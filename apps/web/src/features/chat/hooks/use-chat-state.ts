'use client';

import { useCallback, useState } from 'react';

import { MESSAGE_STATUS } from '@local-ai/constants/chat';

import type { ChatMessage, ChatState } from '../types/chat.types';

const initialState: ChatState = {
	conversationId: null,
	messages: [],
	title: 'New conversation',
	isGenerating: false,
};

export function useChatState() {
	const [state, setState] = useState<ChatState>(initialState);

	const setConversation = useCallback((conversationId: string | null) => {
		setState((current) => ({
			...current,
			conversationId,
		}));
	}, []);

	const setConversationData = useCallback(
		(conversationId: string, title: string, messages: ChatMessage[]) => {
			setState({
				conversationId,
				title,
				messages,
				isGenerating: false,
			});
		},
		[],
	);

	const setTitle = useCallback((title: string) => {
		setState((current) => ({
			...current,
			title,
		}));
	}, []);

	const setGenerating = useCallback((isGenerating: boolean) => {
		setState((current) => ({
			...current,
			isGenerating,
		}));
	}, []);

	const addMessage = useCallback((message: ChatMessage) => {
		setState((current) => ({
			...current,
			messages: [...current.messages, message],
		}));
	}, []);

	const addOptimisticUserMessage = useCallback((content: string) => {
		const message: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			content,
			status: MESSAGE_STATUS.COMPLETED,
		};

		setState((current) => ({
			...current,
			messages: [...current.messages, message],
		}));

		return message;
	}, []);

	const replaceMessageId = useCallback(
		(currentMessageId: string, nextMessageId: string) => {
			setState((current) => ({
				...current,
				messages: current.messages.map((message) =>
					message.id === currentMessageId
						? {
								...message,
								id: nextMessageId,
							}
						: message,
				),
			}));
		},
		[],
	);

	const updateMessage = useCallback(
		(messageId: string, update: Partial<ChatMessage>) => {
			setState((current) => ({
				...current,
				messages: current.messages.map((message) =>
					message.id === messageId
						? {
								...message,
								...update,
							}
						: message,
				),
			}));
		},
		[],
	);

	const appendToken = useCallback((messageId: string, content: string) => {
		setState((current) => ({
			...current,
			messages: current.messages.map((message) =>
				message.id === messageId
					? {
							...message,
							content: message.content + content,
						}
					: message,
			),
		}));
	}, []);

	const setMessageStatus = useCallback(
		(messageId: string, status: ChatMessage['status']) => {
			setState((current) => ({
				...current,
				messages: current.messages.map((message) =>
					message.id === messageId
						? {
								...message,
								status,
							}
						: message,
				),
			}));
		},
		[],
	);

	const failStreamingMessages = useCallback(() => {
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
		}));
	}, []);

	const truncateMessages = useCallback((messageCount: number) => {
		setState((current) => ({
			...current,
			messages: current.messages.slice(0, messageCount),
		}));
	}, []);

	const truncateMessagesAfter = useCallback((messageIndex: number) => {
		setState((current) => ({
			...current,
			messages: current.messages.slice(0, messageIndex + 1),
		}));
	}, []);

	const findMessage = useCallback(
		(messageId: string) =>
			state.messages.find((message) => message.id === messageId),
		[state.messages],
	);

	const editMessageLocally = useCallback(
		(messageId: string, content: string) => {
			setState((current) => {
				const messageIndex = current.messages.findIndex(
					(message) => message.id === messageId,
				);

				if (messageIndex === -1) {
					return current;
				}

				return {
					...current,
					messages: current.messages
						.slice(0, messageIndex + 1)
						.map((message) =>
							message.id === messageId
								? {
										...message,
										content,
										status: MESSAGE_STATUS.COMPLETED,
									}
								: message,
						),
				};
			});
		},
		[],
	);

	const cancelStreamingMessages = useCallback(() => {
		setState((current) => ({
			...current,
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

	const reset = useCallback(() => {
		setState(initialState);
	}, []);

	return {
		state,
		setConversation,
		setConversationData,
		setTitle,
		setGenerating,
		cancelStreamingMessages,
		addMessage,
		addOptimisticUserMessage,
		replaceMessageId,
		updateMessage,
		editMessageLocally,
		appendToken,
		setMessageStatus,
		failStreamingMessages,
		truncateMessages,
		truncateMessagesAfter,
		findMessage,
		reset,
	};
}
