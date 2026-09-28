export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessageStatus =
	| 'streaming'
	| 'completed'
	| 'failed'
	| 'cancelled';

export interface ChatMessage {
	id: string;
	role: ChatMessageRole;
	content: string;
	status: ChatMessageStatus;
}
