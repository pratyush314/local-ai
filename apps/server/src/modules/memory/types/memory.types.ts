import {
  ProjectMemoryKind,
  ProjectMemorySourceType,
} from '@local-ai/constants';

export interface CreateMemoryInput {
  projectId: string;
  kind: ProjectMemoryKind;
  subject: string;
  content: string;
  sourceType: ProjectMemorySourceType;
  sourceMessageId?: string | null;
  sourcePath?: string | null;
  sourceReference?: string | null;
  confidence?: number | null;
}
export interface RetrievedProjectMemory {
  id: string;
  kind: ProjectMemoryKind;
  subject: string;
  content: string;
  confidence: number | null;
  sourceType: ProjectMemorySourceType;
  sourcePath: string | null;
  sourceReference: string | null;
  score: number;
}
