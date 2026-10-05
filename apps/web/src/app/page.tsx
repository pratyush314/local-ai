import { AppShell } from '@/components/layout/app-shell';
import { ChatPage } from '@/features/chat/components/chats/chat-page';

export default function Home() {
	return (
		<AppShell>
			<ChatPage />
		</AppShell>
	);
}
