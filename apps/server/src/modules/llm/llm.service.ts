import { Inject, Injectable } from '@nestjs/common';

import type {
  LlmMessage,
  LlmProvider,
} from './interfaces/llm-provider.interface';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

@Injectable()
export class LlmService {
  constructor(
    @Inject(LLM_PROVIDER)
    private readonly provider: LlmProvider,
  ) {}

  chat(messages: LlmMessage[]): Promise<string> {
    return this.provider.chat(messages);
  }
}
