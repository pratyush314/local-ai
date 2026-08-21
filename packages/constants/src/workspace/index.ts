export const DEFAULT_IGNORED_DIRECTORIES = [
	'node_modules',
	'.git',
	'.next',
	'dist',
	'build',
	'coverage',
	'.turbo',
] as const;

export const DEFAULT_IGNORED_FILES = [
	'.env',
	'.env.local',
	'.env.development',
	'.env.production',
] as const;
