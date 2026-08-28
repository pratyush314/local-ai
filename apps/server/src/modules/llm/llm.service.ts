import { Inject, Injectable } from '@nestjs/common';

import type { LlmProvider } from './interfaces/llm-provider.interface';
import type { LlmGenerationOptions } from './types/llm-generation.type';
import type { LlmStreamEvent } from './types/llm-stream.type';
import { LLM_TITLE_GENERATION } from './constants/llm.constants';

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

  generateTitle(content: string): Promise<string> {
    return this.generate({
      messages: [
        {
          role: 'system',
          content:
            'Generate a short, clear title for the following conversation. Return only the title without quotes, punctuation at the end, explanations, or additional text.',
        },
        {
          role: 'user',
          content,
        },
      ],
      temperature: LLM_TITLE_GENERATION.TEMPERATURE,
      maxTokens: LLM_TITLE_GENERATION.MAX_TOKENS,
    });
  }
}
