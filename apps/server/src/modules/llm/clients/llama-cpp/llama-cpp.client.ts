import { Injectable } from '@nestjs/common';

import { AI_DEFAULTS } from '@local-ai/constants/ai';
import { AppConfigService } from '../../../../common/config/app-config.service.js';

import OpenAI from 'openai';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources';
import { LlmProvider } from '../../interfaces/llm-provider.interface.js';
import type { LlmGenerationOptions } from '../../types/llm-generation.type.js';
import { LlmMessage } from '../../types/llm-message.type.js';
import type { LlmStreamEvent } from '../../types/llm-stream.type.js';
import {
  LlamaCppApplyTemplateResponse,
  LlamaCppStreamResponse,
  LlamaCppTokenizeResponse,
} from './llama-cpp.interface.js';

@Injectable()
export class LlamaCppClient implements LlmProvider {
  private readonly client: OpenAI;

  constructor(private readonly configService: AppConfigService) {
    const baseUrl = this.configService
      .getOrThrow('LLAMA_CPP_BASE_URL')
      .replace(/\/+$/, '');

    this.client = new OpenAI({
      baseURL: `${baseUrl}/v1`,
      apiKey: 'local',
    });
  }

  async generate(options: LlmGenerationOptions): Promise<string> {
    const requestBody = {
      model: 'local-model',
      messages: options.messages,
      temperature: options.temperature ?? AI_DEFAULTS.TEMPERATURE,
      top_p: options.topP ?? AI_DEFAULTS.TOP_P,
      max_completion_tokens: options.maxTokens ?? AI_DEFAULTS.MAX_TOKENS,
      stop: options.stop,
      stream: false,
      ...(options.chatTemplateKwargs
        ? { chat_template_kwargs: options.chatTemplateKwargs }
        : {}),
    } satisfies ChatCompletionCreateParamsNonStreaming & {
      chat_template_kwargs?: Record<string, unknown>;
    };

    try {
      const response = await this.client.chat.completions.create(requestBody, {
        signal: options.signal,
      });

      const choice = response.choices[0];

      if (!choice) {
        throw new Error('llama.cpp returned no completion choices');
      }

      const content = choice.message.content;

      if (typeof content !== 'string' || !content.trim()) {
        throw new Error(
          [
            'llama.cpp returned empty content.',
            `Finish reason: ${choice.finish_reason ?? 'unknown'}.`,
            `Prompt tokens: ${response.usage?.prompt_tokens ?? 'unknown'}.`,
            `Completion tokens: ${response.usage?.completion_tokens ?? 'unknown'}.`,
          ].join(' '),
        );
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
