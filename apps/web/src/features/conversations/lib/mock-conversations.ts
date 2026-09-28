import type { Conversation } from '../types/conversation.types';

export const mockConversations: Conversation[] = [
	{
		id: '1',
		title: 'Understanding local LLM inference',
		updatedAt: 'Today',
	},
	{
		id: '2',
		title: 'Building a NestJS architecture',
		updatedAt: 'Today',
	},
	{
		id: '3',
		title: 'React performance optimization',
		updatedAt: 'Today',
	},
	{
		id: '4',
		title: 'Docker and Kubernetes deployment',
		updatedAt: 'Yesterday',
	},
	{
		id: '5',
		title: 'Designing a scalable database',
		updatedAt: 'Yesterday',
	},
	{
		id: '6',
		title: 'Understanding vector databases',
		updatedAt: 'Previous 7 days',
	},
];
