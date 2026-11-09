export type WorkspaceEntryType = 'file' | 'directory' | 'symlink';

export interface WorkspaceFileEntry {
  name: string;
  path: string;
  type: WorkspaceEntryType;
  extension: string | null;
  size: number | null;
  modifiedAt: string | null;
}

export interface WorkspaceDirectoryListing {
  path: string;
  entries: WorkspaceFileEntry[];
}

export interface WorkspaceFileContent {
  path: string;
  name: string;
  extension: string | null;
  size: number;
  modifiedAt: string;
  content: string;
}
