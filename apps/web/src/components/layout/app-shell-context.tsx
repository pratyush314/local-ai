'use client';

import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

interface AppShellContextValue {
	activeConversationId: string | null;
	refreshVersion: number;
	selectConversation: (conversationId: string) => void;
	startNewChat: () => void;
	markConversationsChanged: () => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({ children }: { children: ReactNode }) {
	const [activeConversationId, setActiveConversationId] = useState<
		string | null
	>(null);
	const [refreshVersion, setRefreshVersion] = useState(0);

	const selectConversation = useCallback((conversationId: string) => {
		setActiveConversationId(conversationId);
	}, []);

	const startNewChat = useCallback(() => {
		setActiveConversationId(null);
	}, []);

	const markConversationsChanged = useCallback(() => {
		setRefreshVersion((version) => version + 1);
	}, []);

	const value = useMemo(
		() => ({
			activeConversationId,
			refreshVersion,
			selectConversation,
			startNewChat,
			markConversationsChanged,
		}),
		[
			activeConversationId,
			refreshVersion,
			selectConversation,
			startNewChat,
			markConversationsChanged,
		],
	);

	return (
		<AppShellContext.Provider value={value}>
			{children}
		</AppShellContext.Provider>
	);
}

export function useAppShell() {
	const context = useContext(AppShellContext);

	if (!context) {
		throw new Error('useAppShell must be used within AppShellProvider');
	}

	return context;
}
