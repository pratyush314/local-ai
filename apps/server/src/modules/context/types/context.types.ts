import { LlmMessage } from '../../llm/types/llm-message.type.js';

export interface PreparedContext {
  messages: LlmMessage[];
  maxTokens: number;
  promptTokens: number;
}
