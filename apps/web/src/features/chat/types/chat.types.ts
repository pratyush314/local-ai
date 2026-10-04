import type { ConversationMessage } from '@local-ai/contracts/chat';

export type ChatMessage = Pick<
	ConversationMessage,
	'id' | 'role' | 'content' | 'status'
>;

export type ChatMessageRole = ChatMessage['role'];
export type ChatMessageStatus = ChatMessage['status'];

export interface ChatState {
	conversationId: string | null;
	messages: ChatMessage[];
	title: string;
	isGenerating: boolean;
}
