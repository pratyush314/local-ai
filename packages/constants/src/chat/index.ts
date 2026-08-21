export const CHAT_ROLES = {
	SYSTEM: 'system',
	USER: 'user',
	ASSISTANT: 'assistant',
} as const;

export const CHAT_MESSAGE_LIMITS = {
	MAX_CONTENT_LENGTH: 100_000,
} as const;
