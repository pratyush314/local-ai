import type { Conversation } from '../types/conversation.types';

interface ConversationGroup {
	title: string;
	conversations: Conversation[];
}

function startOfDay(date: Date): number {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	).getTime();
}

export function groupConversations(
	conversations: Conversation[],
): ConversationGroup[] {
	const now = new Date();

	const today = startOfDay(now);

	const yesterday = today - 24 * 60 * 60 * 1000;

	const sevenDaysAgo = today - 7 * 24 * 60 * 60 * 1000;

	const groups: Record<string, Conversation[]> = {
		Today: [],
		Yesterday: [],
		'Previous 7 days': [],
		Older: [],
	};

	const sorted = [...conversations].sort(
		(a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
	);

	for (const conversation of sorted) {
		const conversationDay = startOfDay(new Date(conversation.updatedAt));

		if (conversationDay === today) {
			groups.Today.push(conversation);
		} else if (conversationDay === yesterday) {
			groups.Yesterday.push(conversation);
		} else if (conversationDay >= sevenDaysAgo) {
			groups['Previous 7 days'].push(conversation);
		} else {
			groups.Older.push(conversation);
		}
	}

	return Object.entries(groups)
		.filter(([, items]) => items.length > 0)
		.map(([title, items]) => ({
			title,
			conversations: items,
		}));
}
