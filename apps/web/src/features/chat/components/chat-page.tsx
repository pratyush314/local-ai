'use client';

import { useState } from 'react';

import { MobileSidebar } from '@/components/layout/mobile-sidebar';

import { ChatInput } from './chat-input';
import { MessageList } from './message-list';
import type { ChatMessage } from '../types/chat.types';

const initialMessages: ChatMessage[] = [
	{
		id: 'demo-user',
		role: 'user',
		content: 'Explain how streaming responses from llama.cpp work.',
		status: 'completed',
	},
	{
		id: 'demo-assistant',
		role: 'assistant',
		content: `llama.cpp can expose an OpenAI-compatible HTTP API.

When streaming is enabled, the server sends partial response chunks as they become available rather than waiting for the complete response.

For example:

\`\`\`ts
for await (const event of stream) {
  if (event.type === "token") {
    process.stdout.write(event.content);
  }
}
\`\`\`

Your NestJS backend can forward those tokens to the browser using **Server-Sent Events (SSE)**.

This gives you a pipeline like:

\`\`\`
Qwen
  ↓
llama.cpp
  ↓
NestJS
  ↓
SSE
  ↓
Next.js
  ↓
Chat UI
\`\`\`

The important part is that the assistant message can be updated incrementally as each token arrives.`,
		status: 'completed',
	},
];

export function ChatPage() {
	const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

	const [isGenerating, setIsGenerating] = useState(false);

	const handleSend = (content: string) => {
		const userMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'user',
			content,
			status: 'completed',
		};

		const assistantMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: 'assistant',
			content: '',
			status: 'streaming',
		};

		setMessages((current) => [...current, userMessage, assistantMessage]);

		setIsGenerating(true);

		// Temporary UI simulation.
		window.setTimeout(() => {
			setMessages((current) =>
				current.map((message) =>
					message.id === assistantMessage.id
						? {
								...message,
								content:
									'This is a temporary streaming response. The next step will replace this simulation with your real NestJS SSE endpoint.',
								status: 'completed',
							}
						: message,
				),
			);

			setIsGenerating(false);
		}, 1200);
	};

	const handleStop = () => {
		setIsGenerating(false);

		setMessages((current) =>
			current.map((message) =>
				message.status === 'streaming'
					? {
							...message,
							status: 'cancelled',
						}
					: message,
			),
		);
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<header className="flex h-14 shrink-0 items-center border-b px-3 md:px-4">
				<div className="flex min-w-0 items-center gap-2">
					<div className="md:hidden">
						<MobileSidebar />
					</div>

					<div className="min-w-0">
						<h1 className="truncate text-sm font-medium">New conversation</h1>
					</div>
				</div>
			</header>

			<div className="flex min-h-0 flex-1 flex-col">
				<MessageList messages={messages} />

				{messages.length === 0 && (
					<div className="flex flex-1 items-center justify-center px-4">
						<div className="w-full max-w-2xl text-center">
							<h2 className="text-2xl font-semibold tracking-tight">
								Start a conversation
							</h2>

							<p className="mt-2 text-sm text-muted-foreground">
								Ask anything. Your conversation stays on your local machine.
							</p>
						</div>
					</div>
				)}

				<ChatInput
					onSend={handleSend}
					onStop={handleStop}
					isGenerating={isGenerating}
				/>
			</div>
		</div>
	);
}
