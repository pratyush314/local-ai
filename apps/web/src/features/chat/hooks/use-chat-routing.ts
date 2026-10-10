'use client';

import { useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';

import { useAppShell } from '@/components/layout/app-shell-context';

export function useChatRouting() {
	const params = useParams();

	const { activeConversationId, selectConversation, startNewChat } =
		useAppShell();

	const routeParam = params?.conversationId;

	const conversationId =
		typeof routeParam === 'string'
			? routeParam
			: Array.isArray(routeParam)
				? (routeParam[0] ?? null)
				: null;

	useEffect(() => {
		if (conversationId === activeConversationId) {
			return;
		}

		if (conversationId) {
			selectConversation(conversationId);
		} else {
			startNewChat();
		}
	}, [conversationId, activeConversationId, selectConversation, startNewChat]);

	const handleConversationChange = useCallback(
		(nextConversationId: string) => {
			if (nextConversationId === activeConversationId) {
				return;
			}

			selectConversation(nextConversationId);

			// Update the URL without triggering an App Router navigation.
			// This prevents the active chat stream from being interrupted.
			window.history.replaceState(
				window.history.state,
				'',
				`/chat/${encodeURIComponent(nextConversationId)}`,
			);
		},
		[activeConversationId, selectConversation],
	);

	return {
		conversationId,
		handleConversationChange,
	};
}
