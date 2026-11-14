import { LlmMessage } from '../../llm/types/llm-message.type.js';

export interface PreparedContext {
  messages: LlmMessage[];
  maxTokens: number;
  promptTokens: number;
  contextSize: number;
  inputBudget: number;
  historyTrimmed: boolean;
  messageCountBefore: number;
  messageCountAfter: number;
  remainingTokens: number;
  turnCountBefore: number;
  turnCountAfter: number;
}
export interface WorkspaceSearchResult {
  fileId: string;
  relativePath: string;
  name: string;
  snippet: string;
  tokenCount: number | null;
  score: number;
  matchedTerms: string[];
}

export interface PreparedWorkspaceContext extends PreparedContext {
  workspaceFiles: Array<{
    fileId: string;
    relativePath: string;
    score: number;
  }>;
}
