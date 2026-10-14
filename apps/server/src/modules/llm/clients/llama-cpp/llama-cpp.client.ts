import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../../common/config/app-config.service.js';
import { AI_DEFAULTS } from '@local-ai/constants/ai';

import type { LlmGenerationOptions } from '../../types/llm-generation.type.js';
import type { LlmStreamEvent } from '../../types/llm-stream.type.js';
import {
  LlamaCppApplyTemplateResponse,
  LlamaCppResponse,
  LlamaCppStreamResponse,
  LlamaCppTokenizeResponse,
} from './llama-cpp.interface.js';
import { LlmMessage } from '../../types/llm-message.type.js';
import { LlmProvider } from '../../interfaces/llm-provider.interface.js';

@Injectable()
export class LlamaCppClient implements LlmProvider {
  constructor(private readonly configService: AppConfigService) {}

  async generate(options: LlmGenerationOptions): Promise<string> {
    const baseUrl = this.configService.getOrThrow('LLAMA_CPP_BASE_URL');

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: options.messages,
          temperature: options.temperature ?? AI_DEFAULTS.TEMPERATURE,
          top_p: options.topP ?? AI_DEFAULTS.TOP_P,
          max_tokens: options.maxTokens ?? AI_DEFAULTS.MAX_TOKENS,
          stop: options.stop,
          stream: false,
        }),
        signal: options.signal,
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
    } catch (error) {
      if (options.signal?.aborted) {
        throw new Error('LLM generation aborted');
      }

      throw error;
    }
  }

  async *stream(options: LlmGenerationOptions): AsyncIterable<LlmStreamEvent> {
    const baseUrl = this.configService.getOrThrow('LLAMA_CPP_BASE_URL');
    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: options.messages,
          temperature: options.temperature ?? AI_DEFAULTS.TEMPERATURE,
          top_p: options.topP ?? AI_DEFAULTS.TOP_P,
          max_tokens: options.maxTokens ?? AI_DEFAULTS.MAX_TOKENS,
          stop: options.stop,
          stream: true,
        }),
        signal: options.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();

        throw new Error(
          `llama.cpp streaming request failed (${response.status}): ${errorBody}`,
        );
      }

      if (!response.body) {
        throw new Error('llama.cpp returned an empty response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, {
            stream: true,
          });

          const lines = buffer.split('\n');

          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmedLine = line.trim();

            if (!trimmedLine || !trimmedLine.startsWith('data:')) {
              continue;
            }

            const data = trimmedLine.slice(5).trim();

            if (data === '[DONE]') {
              yield {
                type: 'done',
              };

              return;
            }

            let parsed: LlamaCppStreamResponse;

            try {
              parsed = JSON.parse(data) as LlamaCppStreamResponse;
            } catch {
              continue;
            }

            const choice = parsed.choices[0];

            if (!choice) {
              continue;
            }

            const content = choice.delta?.content ?? '';

            if (content) {
              yield {
                content,
                type: 'token',
              };
            }

            if (choice.finish_reason) {
              yield {
                type: 'done',
              };

              return;
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (options.signal?.aborted) {
        throw new Error('LLM generation aborted');
      }

      throw error;
    }
  }

  async countPromptTokens(
    messages: LlmMessage[],
    signal?: AbortSignal,
  ): Promise<number> {
    const baseUrl = this.configService
      .getOrThrow('LLAMA_CPP_BASE_URL')
      .replace(/\/+$/, '');

    const templateResponse = await fetch(`${baseUrl}/apply-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal,
    });

    if (!templateResponse.ok) {
      const errorBody = await templateResponse.text();

      throw new Error(
        `llama.cpp template request failed (${templateResponse.status}): ${errorBody}`,
      );
    }

    const templateData =
      (await templateResponse.json()) as LlamaCppApplyTemplateResponse;

    if (typeof templateData.prompt !== 'string') {
      throw new Error('llama.cpp returned an invalid formatted prompt');
    }

    const tokenizeResponse = await fetch(`${baseUrl}/tokenize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: templateData.prompt,
        add_special: false,
        parse_special: true,
      }),
      signal,
    });

    if (!tokenizeResponse.ok) {
      const errorBody = await tokenizeResponse.text();

      throw new Error(
        `llama.cpp tokenization request failed (${tokenizeResponse.status}): ${errorBody}`,
      );
    }

    const tokenizeData =
      (await tokenizeResponse.json()) as LlamaCppTokenizeResponse;

    if (!Array.isArray(tokenizeData.tokens)) {
      throw new Error('llama.cpp returned an invalid tokenization response');
    }

    return tokenizeData.tokens.length;
  }
}
