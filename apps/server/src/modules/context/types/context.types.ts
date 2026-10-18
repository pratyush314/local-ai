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
