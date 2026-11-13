export interface WorkspaceScanResult {
  workspaceDirectoryId: string;
  discovered: number;
  added: number;
  changed: number;
  unchanged: number;
  removed: number;
  skipped: number;
}

export interface WorkspaceContentIndexResult {
  workspaceDirectoryId: string;
  pending: number;
  indexed: number;
  failed: number;
}
