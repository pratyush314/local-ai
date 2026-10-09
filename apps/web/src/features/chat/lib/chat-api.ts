import {
	chatStreamEventSchema,
	continueChatSchema,
	ConversationMessages,
	conversationMessagesSchema,
	editMessageSchema,
	startChatSchema,
	type ChatStreamEvent,
	type ContinueChatInput,
	type EditMessageInput,
	type StartChatInput,
} from '@local-ai/contracts/chat';

import { apiClient } from '@/lib/api/apiClient';
import { sseClient } from '@/lib/api/sseClient';

import { API_ENDPOINTS } from '@/constants/api-constants';

export function startChat(
	input: StartChatInput,
	signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
	return sseClient({
		path: API_ENDPOINTS.CHAT.START,
		method: 'POST',
		body: input,
		bodySchema: startChatSchema,
		eventSchema: chatStreamEventSchema,
		signal,
	});
}

export function continueChat(
	conversationId: string,
	input: ContinueChatInput,
	signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
	return sseClient({
		path: API_ENDPOINTS.CHAT.CONTINUE(conversationId),
		method: 'POST',
		body: input,
		bodySchema: continueChatSchema,
		eventSchema: chatStreamEventSchema,
		signal,
	});
}

export function regenerateMessage(
	conversationId: string,
	messageId: string,
	signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
	return sseClient({
		path: API_ENDPOINTS.CHAT.REGENERATE(conversationId, messageId),
		method: 'POST',
		eventSchema: chatStreamEventSchema,
		signal,
	});
}

export function editMessage(
	conversationId: string,
	messageId: string,
	input: EditMessageInput,
	signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
	return sseClient({
		path: API_ENDPOINTS.CHAT.EDIT(conversationId, messageId),
		method: 'POST',
		body: input,
		bodySchema: editMessageSchema,
		eventSchema: chatStreamEventSchema,
		signal,
	});
}

export function getConversationMessages(
	conversationId: string,
): Promise<ConversationMessages> {
	return apiClient({
		path: API_ENDPOINTS.CONVERSATIONS.MESSAGES(conversationId),
		method: 'GET',
		responseSchema: conversationMessagesSchema,
	});
}
