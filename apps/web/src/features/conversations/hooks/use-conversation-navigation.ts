'use client';

import { useCallback } from 'react';

import { useAppShell } from '@/components/layout/app-shell-context';
import { useRouter } from 'next/navigation';

export function useConversationNavigation(onClose?: () => void) {
	const router = useRouter();
	const { activeConversationId, startNewChat } = useAppShell();

	const handleSelectConversation = useCallback(
		(_conversationId: string) => {
			// The Link changes the URL.
			// useChatRouting synchronizes the active conversation from that URL.
			onClose?.();
		},
		[onClose],
	);

	const handleStartNewChat = useCallback(() => {
		startNewChat();
		router.push('/chat');
		onClose?.();
	}, [startNewChat, router, onClose]);

	const handleConversationDeleted = useCallback(
		(conversationId: string) => {
			if (activeConversationId === conversationId) {
				startNewChat();
				router.push('/chat');
			}

			onClose?.();
		},
		[activeConversationId, router, startNewChat, onClose],
	);

	return {
		activeConversationId,
		handleSelectConversation,
		handleStartNewChat,
		handleConversationDeleted,
	};
}
