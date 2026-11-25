'use client';

import { useCallback, useEffect } from 'react';

import { useAppShell } from '@/components/layout/app-shell-context';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';

import { useChat } from '../../hooks/use-chat';
import { useChatRouting } from '../../hooks/use-chat-routing';
import { ChatContent } from './chat-content';

export function ChatPage() {
	const { conversationId, handleConversationChange } = useChatRouting();

	const { markConversationsChanged } = useAppShell();

	const handleConversationUpdated = useCallback(() => {
		markConversationsChanged();
	}, [markConversationsChanged]);

	const {
		messages,
		title,
		isGenerating,
		isLoadingConversation,
		loadError,
		clearLoadError,
		sendMessage,
		stopGeneration,
		editMessage,
		regenerateMessage,
	} = useChat({
		conversationId,
		onConversationChange: handleConversationChange,
		onConversationUpdated: handleConversationUpdated,
	});

	useEffect(() => {
		const pageTitle = title.trim() || 'Local AI';
		document.title = `${pageTitle} | Local AI`;
	}, [title]);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="flex h-14 shrink-0 items-center border-b px-3 md:px-4">
				<div className="flex min-w-0 items-center gap-2">
					<div className="md:hidden">
						<MobileSidebar />
					</div>

					<div className="min-w-0">
						<h1 className="truncate text-sm font-medium">{title}</h1>
					</div>
				</div>
			</header>

			<ChatContent
				messages={messages}
				isGenerating={isGenerating}
				isLoadingConversation={isLoadingConversation}
				loadError={loadError}
				clearLoadError={clearLoadError}
				sendMessage={sendMessage}
				stopGeneration={stopGeneration}
				editMessage={editMessage}
				regenerateMessage={regenerateMessage}
			/>
		</div>
	);
}
