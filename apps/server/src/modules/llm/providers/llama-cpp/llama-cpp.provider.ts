import { Injectable } from '@nestjs/common';

import { LlamaCppClient } from '../../clients/llama-cpp/llama-cpp.client.js';
import type { LlmProvider } from '../../interfaces/llm-provider.interface.js';
import type { LlmGenerationOptions } from '../../types/llm-generation.type.js';
import type { LlmStreamEvent } from '../../types/llm-stream.type.js';

@Injectable()
export class LlamaCppProvider implements LlmProvider {
  constructor(private readonly client: LlamaCppClient) {}

  generate(options: LlmGenerationOptions): Promise<string> {
    return this.client.generate(options);
  }

  stream(options: LlmGenerationOptions): AsyncIterable<LlmStreamEvent> {
    return this.client.stream(options);
  }
}
