import {
	chatStreamEventSchema,
	continueChatSchema,
	startChatSchema,
	type ChatStreamEvent,
	type ContinueChatInput,
	type StartChatInput,
} from '@local-ai/contracts/chat';

import { sseClient } from '@/lib/api/sseClient';

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
