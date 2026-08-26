export const CHAT_MESSAGE_LIMITS = {
	MAX_CONTENT_LENGTH: 100_000,
} as const;

export const CHAT_ROLES = {
	SYSTEM: 'system',
	USER: 'user',
	ASSISTANT: 'assistant',
} as const;

export type ChatRole = (typeof CHAT_ROLES)[keyof typeof CHAT_ROLES];

export const MESSAGE_STATUS = {
	PENDING: 'pending',
	STREAMING: 'streaming',
	COMPLETED: 'completed',
	FAILED: 'failed',
	CANCELLED: 'cancelled',
} as const;

export type MessageStatus =
	(typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];
