import {
	ConversationMessages,
	conversationMessagesSchema,
} from '@local-ai/contracts/chat';
import {
	conversationSchema,
	conversationsSchema,
	deleteConversationSchema,
	type Conversation,
	type Conversations,
} from '@local-ai/contracts/conversation';

import { API_ENDPOINTS } from '@/constants/api-constants';
import { apiClient } from '@/lib/api/apiClient';

export function getConversationMessages(
	conversationId: string,
): Promise<ConversationMessages> {
	return apiClient({
		path: API_ENDPOINTS.CONVERSATIONS.MESSAGES(conversationId),
		method: 'GET',
		responseSchema: conversationMessagesSchema,
	});
}

export function getConversations(): Promise<Conversations> {
	return apiClient({
		path: API_ENDPOINTS.CONVERSATIONS.LIST,
		method: 'GET',
		responseSchema: conversationsSchema,
	});
}

export function getConversation(conversationId: string): Promise<Conversation> {
	return apiClient({
		path: API_ENDPOINTS.CONVERSATIONS.BY_ID(conversationId),
		method: 'GET',
		responseSchema: conversationSchema,
	});
}

export function createConversation(): Promise<Conversation> {
	return apiClient({
		path: API_ENDPOINTS.CONVERSATIONS.CREATE,
		method: 'POST',
		responseSchema: conversationSchema,
	});
}

export function deleteConversation(
	conversationId: string,
): Promise<{ success: true }> {
	return apiClient({
		path: API_ENDPOINTS.CONVERSATIONS.DELETE(conversationId),
		method: 'DELETE',
		responseSchema: deleteConversationSchema,
	});
}
