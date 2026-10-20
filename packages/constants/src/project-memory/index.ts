export const PROJECT_MEMORY_KINDS = [
	'decision',
	'constraint',
	'fact',
	'task',
] as const;

export type ProjectMemoryKind = (typeof PROJECT_MEMORY_KINDS)[number];

export const PROJECT_MEMORY_STATUSES = [
	'active',
	'superseded',
	'archived',
	'unverified',
] as const;

export type ProjectMemoryStatus = (typeof PROJECT_MEMORY_STATUSES)[number];

export const PROJECT_MEMORY_SOURCE_TYPES = [
	'message',
	'file',
	'user',
	'git',
	'system',
] as const;

export type ProjectMemorySourceType =
	(typeof PROJECT_MEMORY_SOURCE_TYPES)[number];
