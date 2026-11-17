export const API_ENDPOINTS = {
	CONVERSATIONS: {
		LIST: '/conversations',
		CREATE: '/conversations',
		BY_ID: (conversationId: string) => `/conversations/${conversationId}`,
		DELETE: (conversationId: string) => `/conversations/${conversationId}`,
		MESSAGES: (conversationId: string) =>
			`/conversations/${conversationId}/messages`,
	},
	CHAT: {
		START: '/chat',
		CONTINUE: (conversationId: string) => `/chat/${conversationId}/messages`,
		REGENERATE: (conversationId: string, messageId: string) =>
			`/chat/${conversationId}/messages/${messageId}/regenerate`,
		EDIT: (conversationId: string, messageId: string) =>
			`/chat/${conversationId}/messages/${messageId}/edit`,
	},

	PROJECTS: {
		LIST: '/projects',
		CREATE: '/projects',
		BY_ID: (projectId: string) => `/projects/${projectId}`,
		UPDATE: (projectId: string) => `/projects/${projectId}`,
		DELETE: (projectId: string) => `/projects/${projectId}`,
	},
} as const;
