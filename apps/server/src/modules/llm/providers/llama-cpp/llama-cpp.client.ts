import { Injectable } from '@nestjs/common';

import { AppConfigService } from '@/common/config/app-config.service';
import { AI_DEFAULTS } from '@local-ai/constants/ai';

import type { LlmMessage } from '../../interfaces/llm-provider.interface';

interface LlamaCppResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

@Injectable()
export class LlamaCppClient {
  constructor(private readonly configService: AppConfigService) {}

  async chat(messages: LlmMessage[]): Promise<string> {
    const baseUrl = this.configService.getOrThrow('LLAMA_CPP_BASE_URL');

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        temperature: AI_DEFAULTS.TEMPERATURE,
        top_p: AI_DEFAULTS.TOP_P,
        max_tokens: AI_DEFAULTS.MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();

      throw new Error(
        `llama.cpp request failed (${response.status}): ${errorBody}`,
      );
    }

    const data = (await response.json()) as LlamaCppResponse;

    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('llama.cpp returned an empty response');
    }

    return content;
  }
}
