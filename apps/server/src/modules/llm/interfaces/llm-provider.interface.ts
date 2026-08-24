import { LlmGenerationOptions } from '../types/llm-generation.type';
import { LlmStreamEvent } from '../types/llm-stream.type';

export interface LlmProvider {
  generate(options: LlmGenerationOptions): Promise<string>;

  stream(options: LlmGenerationOptions): AsyncIterable<LlmStreamEvent>;
}
