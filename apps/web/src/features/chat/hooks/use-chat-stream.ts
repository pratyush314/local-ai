'use client';

import { useCallback, useRef } from 'react';

import type { ChatStreamEvent } from '@local-ai/contracts/chat';

import {
	processChatStream,
	type ChatStreamProcessorHandlers,
} from '../lib/chat-stream';

interface UseChatStreamOptions {
	handlers: ChatStreamProcessorHandlers;
}

export function useChatStream({ handlers }: UseChatStreamOptions) {
	const abortControllerRef = useRef<AbortController | null>(null);
	const runIdRef = useRef(0);

	const startStream = useCallback(
		async (
			stream: AsyncGenerator<ChatStreamEvent>,
			activeConversationId: string | null,
			pendingUserMessageId?: string,
		): Promise<void> => {
			// Invalidate and abort any previous stream.
			abortControllerRef.current?.abort();

			const controller = new AbortController();
			abortControllerRef.current = controller;

			const runId = ++runIdRef.current;

			// Clear the previous stream error before starting.
			handlers.setLoadError(null);

			try {
				await processChatStream({
					stream,
					controller,
					runId,
					activeConversationId,
					currentRunId: () => runIdRef.current,
					handlers,
					pendingUserMessageId,
				});
			} catch (error) {
				// Ignore errors caused by intentional cancellation.
				if (controller.signal.aborted || runId !== runIdRef.current) {
					return;
				}

				handlers.failStreamingMessages();
				handlers.setGenerating(false);
				handlers.setLoadError({
					conversationId: activeConversationId,
					message:
						error instanceof Error
							? error.message
							: 'An unexpected error occurred while streaming the response.',
				});
			} finally {
				if (runId === runIdRef.current) {
					abortControllerRef.current = null;
				}
			}
		},
		[handlers],
	);

	const stopGeneration = useCallback(() => {
		// Invalidate the run before aborting it.
		runIdRef.current += 1;

		abortControllerRef.current?.abort();
		abortControllerRef.current = null;
	}, []);

	const abortGeneration = useCallback(() => {
		abortControllerRef.current?.abort();
	}, []);

	return {
		startStream,
		stopGeneration,
		abortGeneration,
	};
}
