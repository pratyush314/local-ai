'use client';

import { useCallback } from 'react';

import { useAppShell } from '@/components/layout/app-shell-context';

export function useConversationNavigation(onClose?: () => void) {
	const { activeConversationId, selectConversation, startNewChat } =
		useAppShell();

	const handleSelectConversation = useCallback(
		(conversationId: string) => {
			selectConversation(conversationId);
			onClose?.();
		},
		[selectConversation, onClose],
	);

	const handleStartNewChat = useCallback(() => {
		startNewChat();
		onClose?.();
	}, [startNewChat, onClose]);

	const handleConversationDeleted = useCallback(
		(conversationId: string) => {
			if (activeConversationId === conversationId) {
				startNewChat();
			}
			onClose?.();
		},
		[activeConversationId, startNewChat, onClose],
	);

	return {
		activeConversationId,
		handleSelectConversation,
		handleStartNewChat,
		handleConversationDeleted,
	};
}
