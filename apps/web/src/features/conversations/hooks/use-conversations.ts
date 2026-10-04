'use client';

import { useCallback, useEffect, useState } from 'react';

import { deleteConversation, getConversations } from '../lib/conversation-api';
import type { Conversation } from '../types/conversation.types';

interface UseConversationsOptions {
	refreshVersion?: number;
}

export function useConversations({
	refreshVersion,
}: UseConversationsOptions = {}) {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadConversations = useCallback(async () => {
		try {
			setError(null);

			const data = await getConversations();

			setConversations(data);
		} catch (error) {
			console.error('Failed to load conversations:', error);

			setError(
				error instanceof Error ? error.message : 'Failed to load conversations',
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const removeConversation = useCallback(async (conversationId: string) => {
		try {
			setIsDeleting(true);
			setError(null);

			await deleteConversation(conversationId);

			setConversations((current) =>
				current.filter((conversation) => conversation.id !== conversationId),
			);
		} catch (error) {
			console.error('Failed to delete conversation:', error);

			setError(
				error instanceof Error
					? error.message
					: 'Failed to delete conversation',
			);

			throw error;
		} finally {
			setIsDeleting(false);
		}
	}, []);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void loadConversations();
	}, [loadConversations, refreshVersion]);

	return {
		conversations,

		isLoading,
		isDeleting,
		error,
		refresh: loadConversations,
		removeConversation,
	};
}
