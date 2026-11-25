'use client';

import { useCallback, useEffect, useState } from 'react';

import {
	deleteConversation,
	getConversations,
	getProjectConversations,
} from '../lib/conversation-api';
import type { Conversation } from '../types/conversation.types';

interface UseConversationsOptions {
	refreshVersion?: number;
	projectId?: string;
}

export function useConversations({
	projectId,
	refreshVersion,
}: UseConversationsOptions = {}) {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadConversations = useCallback(async () => {
		try {
			setError(null);

			const data = projectId
				? await getProjectConversations(projectId)
				: await getConversations();

			setConversations(data);
		} catch (err) {
			console.error('Failed to load conversations:', err);
			setError(
				err instanceof Error ? err.message : 'Failed to load conversations',
			);
		} finally {
			setIsLoading(false);
		}
	}, [projectId]);

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
