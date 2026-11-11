export const WORKSPACE_FILE_INDEX_STATUS = {
	PENDING: 'pending',
	INDEXED: 'indexed',
	UNSUPPORTED: 'unsupported',
	FAILED: 'failed',
} as const;

export type WorkspaceFileIndexStatus =
	(typeof WORKSPACE_FILE_INDEX_STATUS)[keyof typeof WORKSPACE_FILE_INDEX_STATUS];
