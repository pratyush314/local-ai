import {
	chatStreamEventSchema,
	continueChatSchema,
	ConversationMessages,
	conversationMessagesSchema,
	startChatSchema,
	type ChatStreamEvent,
	type ContinueChatInput,
	type StartChatInput,
} from '@local-ai/contracts/chat';

import { sseClient } from '@/lib/api/sseClient';
import { apiClient } from '@/lib/api/apiClient';

export function startChat(
	input: StartChatInput,
	signal?: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
	return sseClient({
		path: '/chat',
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
		path: `/chat/${conversationId}/messages`,
		method: 'POST',
		body: input,
		bodySchema: continueChatSchema,
		eventSchema: chatStreamEventSchema,
		signal,
	});
}

export function getConversationMessages(
	conversationId: string,
): Promise<ConversationMessages> {
	return apiClient({
		path: `/conversations/${conversationId}/messages`,
		method: 'GET',
		responseSchema: conversationMessagesSchema,
	});
}
