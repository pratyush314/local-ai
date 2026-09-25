import type { LlmMessage } from './llm-message.type';

export interface LlmGenerationOptions {
  messages: LlmMessage[];

  temperature?: number;
  topP?: number;
  maxTokens?: number;

  stop?: string[];

  signal?: AbortSignal;

  chatTemplateKwargs?: Record<string, unknown>;
}
