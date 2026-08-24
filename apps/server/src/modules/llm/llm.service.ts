import { Inject, Injectable } from '@nestjs/common';

import type { LlmProvider } from './interfaces/llm-provider.interface';
import type { LlmGenerationOptions } from './types/llm-generation.type';
import type { LlmStreamEvent } from './types/llm-stream.type';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

@Injectable()
export class LlmService {
  constructor(
    @Inject(LLM_PROVIDER)
    private readonly provider: LlmProvider,
  ) {}

  generate(options: LlmGenerationOptions): Promise<string> {
    return this.provider.generate(options);
  }

  stream(options: LlmGenerationOptions): AsyncIterable<LlmStreamEvent> {
    return this.provider.stream(options);
  }
}
