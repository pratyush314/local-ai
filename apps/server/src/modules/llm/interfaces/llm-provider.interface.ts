import { LlmGenerationOptions } from '../types/llm-generation.type.js';
import { LlmMessage } from '../types/llm-message.type.js';
import { LlmStreamEvent } from '../types/llm-stream.type.js';

export interface LlmProvider {
  generate(options: LlmGenerationOptions): Promise<string>;

  stream(options: LlmGenerationOptions): AsyncIterable<LlmStreamEvent>;

  countPromptTokens(
    messages: LlmMessage[],
    signal?: AbortSignal,
  ): Promise<number>;
}
