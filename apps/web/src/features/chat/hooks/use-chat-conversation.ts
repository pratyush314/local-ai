'use client';

import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

import {
	getConversation,
	getConversationMessages,
} from '@/features/conversations/lib/conversation-api';

import type { ChatState } from '../types/chat.types';

interface UseChatConversationOptions {
	conversationId: string | null;
	skipNextLoadRef: RefObject<string | null>;

	setConversationData: (
		conversationId: string,
		title: string,
		messages: ChatState['messages'],
	) => void;

	setConversation: (conversationId: string | null) => void;
	reset: () => void;
	abortGeneration: () => void;
}

interface ConversationLoadError {
	conversationId: string;
	message: string;
}

export function useChatConversation({
	conversationId,
	setConversationData,
	setConversation,
	reset,
	abortGeneration,
	skipNextLoadRef,
}: UseChatConversationOptions) {
	const [loadError, setLoadError] = useState<ConversationLoadError | null>(
		null,
	);

	const [isLoadingConversation, setIsLoadingConversation] = useState(false);

	const loadedConversationIdRef = useRef<string | null>(null);

	useEffect(() => {
		const runIfConversationIdIsNull = () => {
			setLoadError(null);
			setIsLoadingConversation(false);
			reset();
		};
		if (!conversationId) {
			loadedConversationIdRef.current = null;
			runIfConversationIdIsNull();
			return;
		}

		/**
		 * A new conversation was created through the chat stream.
		 * Preserve the existing streaming state instead of fetching
		 * and replacing it immediately.
		 */
		if (skipNextLoadRef.current === conversationId) {
			skipNextLoadRef.current = null;

			loadedConversationIdRef.current = conversationId;

			return;
		}

		if (loadedConversationIdRef.current === conversationId) {
			return;
		}

		let cancelled = false;

		abortGeneration();

		setIsLoadingConversation(true);
		setLoadError(null);

		async function loadConversation(conversationId: string) {
			try {
				const [conversation, messages] = await Promise.all([
					getConversation(conversationId),
					getConversationMessages(conversationId),
				]);

				if (cancelled) {
					return;
				}

				const chatMessages: ChatState['messages'] = messages.map((message) => ({
					id: message.id,
					role: message.role,
					content: message.content,
					status: message.status,
				}));

				setConversationData(conversation.id, conversation.title, chatMessages);

				loadedConversationIdRef.current = conversation.id;
			} catch (error) {
				if (cancelled) {
					return;
				}

				setLoadError({
					conversationId,
					message:
						error instanceof Error
							? error.message
							: 'Failed to load conversation',
				});

				loadedConversationIdRef.current = null;
				setConversation(null);
				reset();
			} finally {
				if (!cancelled) {
					setIsLoadingConversation(false);
				}
			}
		}

		void loadConversation(conversationId);

		return () => {
			cancelled = true;
		};
	}, [
		conversationId,
		setConversationData,
		setConversation,
		reset,
		abortGeneration,
		skipNextLoadRef,
	]);

	const clearLoadError = useCallback(() => {
		setLoadError(null);
	}, []);

	return {
		isLoadingConversation,
		loadError,
		clearLoadError,
	};
}
