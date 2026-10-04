import { Conversation } from '@local-ai/contracts';
import { ConversationItem } from './conversation-item';

interface ConversationGroupProps {
	title: string;
	conversations: Conversation[];
	activeConversationId: string | null;
	onSelect?: (id: string) => void;
	handleDeleteConversation: (conversationId: string) => Promise<void>;
}
export function ConversationGroup({
	title,
	conversations,
	activeConversationId,
	onSelect,
	handleDeleteConversation,
}: ConversationGroupProps) {
	return (
		<section className="mb-5">
			<h2 className="mb-1 px-2.5 text-xs font-medium text-muted-foreground">
				{title}
			</h2>

			<div className="space-y-0.5">
				{conversations.map((conversation) => (
					<ConversationItem
						key={conversation.id}
						conversation={conversation}
						active={activeConversationId === conversation.id}
						onClick={() => onSelect?.(conversation.id)}
						onDelete={() => handleDeleteConversation(conversation.id)}
					/>
				))}
			</div>
		</section>
	);
}
