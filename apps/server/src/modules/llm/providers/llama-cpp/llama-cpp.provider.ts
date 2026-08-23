import { Injectable } from '@nestjs/common';

import type {
  LlmMessage,
  LlmProvider,
} from '../../interfaces/llm-provider.interface';

import { LlamaCppClient } from './llama-cpp.client';

@Injectable()
export class LlamaCppProvider implements LlmProvider {
  constructor(private readonly client: LlamaCppClient) {}

  chat(messages: LlmMessage[]): Promise<string> {
    return this.client.chat(messages);
  }
}
