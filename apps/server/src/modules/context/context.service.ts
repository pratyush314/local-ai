import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { CHAT_ROLES } from '@local-ai/constants/chat';

import { AppConfigService } from '../../common/config/app-config.service.js';
import { LlmService } from '../llm/llm.service.js';
import type { LlmMessage } from '../llm/types/llm-message.type.js';
import type { PreparedContext } from './types/context.types.js';

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);

  constructor(
    private readonly configService: AppConfigService,
    private readonly llmService: LlmService,
  ) {}

  async prepare(
    messages: LlmMessage[],
    signal?: AbortSignal,
  ): Promise<PreparedContext> {
    const contextSize = this.configService.get('LLAMA_CONTEXT_SIZE');
    const outputLimit = this.configService.get('CHAT_MAX_OUTPUT_TOKENS');
    const safetyTokens = this.configService.get('CHAT_CONTEXT_SAFETY_TOKENS');

    const inputBudget = contextSize - outputLimit - safetyTokens;

    if (inputBudget <= 0) {
      throw new Error(
        'Invalid context configuration: context size must exceed the output and safety budgets',
      );
    }

    const { prefix, turns } = this.splitIntoTurns(messages);
    const turnCountBefore = turns.length;

    const buildCandidate = (start: number): LlmMessage[] => [
      ...prefix,
      ...turns.slice(start).flat(),
    ];

    const tokenCounts = new Map<number, Promise<number>>();

    const countAt = (start: number): Promise<number> => {
      let result = tokenCounts.get(start);

      if (!result) {
        result = this.llmService.countPromptTokens(
          buildCandidate(start),
          signal,
        );

        tokenCounts.set(start, result);
      }

      return result;
    };

    const allMessages = buildCandidate(0);
    const allTokens = await countAt(0);

    if (allTokens <= inputBudget) {
      const prepared = {
        messages: allMessages,
        maxTokens: Math.min(
          outputLimit,
          contextSize - allTokens - safetyTokens,
        ),
        promptTokens: allTokens,
        contextSize,
        inputBudget,
        historyTrimmed: false,
        messageCountBefore: messages.length,
        messageCountAfter: allMessages.length,
        remainingTokens: contextSize - allTokens - safetyTokens,
        turnCountBefore,
        turnCountAfter: turns.length,
      };

      this.logPreparedContext(prepared);

      return prepared;
    }

    if (turns.length === 0) {
      throw this.messageTooLarge();
    }

    const newestStart = turns.length - 1;
    const newestTokens = await countAt(newestStart);

    if (newestTokens > inputBudget) {
      throw this.messageTooLarge();
    }

    // Find the longest suffix of complete turns that fits.
    //
    // Check candidates from oldest retained turn to newest.
    // The first candidate that fits retains the most history.
    // This avoids relying on token counts being monotonic.
    let selectedStart: number | null = null;

    for (let start = 1; start <= newestStart; start++) {
      const tokens = await countAt(start);

      if (tokens <= inputBudget) {
        selectedStart = start;
        break;
      }
    }

    if (selectedStart === null) {
      throw this.messageTooLarge();
    }

    const selectedMessages = buildCandidate(selectedStart);
    const promptTokens = await countAt(selectedStart);

    const prepared: PreparedContext = {
      messages: selectedMessages,
      maxTokens: Math.min(
        outputLimit,
        contextSize - promptTokens - safetyTokens,
      ),
      promptTokens,
      contextSize,
      inputBudget,
      historyTrimmed: true,
      messageCountBefore: messages.length,
      messageCountAfter: selectedMessages.length,
      remainingTokens: contextSize - promptTokens - safetyTokens,
      turnCountBefore,
      turnCountAfter: turns.length - selectedStart,
    };

    this.logPreparedContext(prepared);

    return prepared;
  }

  private logPreparedContext(context: PreparedContext): void {
    this.logger.debug(
      JSON.stringify({
        event: 'context_prepared',
        promptTokens: context.promptTokens,
        contextSize: context.contextSize,
        inputBudget: context.inputBudget,
        maxOutputTokens: context.maxTokens,
        historyTrimmed: context.historyTrimmed,
        messageCountBefore: context.messageCountBefore,
        messageCountAfter: context.messageCountAfter,
        remainingTokens: context.remainingTokens,
        turnCountBefore: context.turnCountBefore,
        turnCountAfter: context.turnCountAfter,
      }),
    );
  }

  private splitIntoTurns(messages: LlmMessage[]): {
    prefix: LlmMessage[];
    turns: LlmMessage[][];
  } {
    const prefix: LlmMessage[] = [];
    const turns: LlmMessage[][] = [];

    let currentTurn: LlmMessage[] = [];

    for (const message of messages) {
      if (
        message.role === CHAT_ROLES.SYSTEM &&
        currentTurn.length === 0 &&
        turns.length === 0
      ) {
        prefix.push(message);
        continue;
      }

      if (message.role === CHAT_ROLES.USER) {
        if (currentTurn.length > 0) {
          turns.push(currentTurn);
        }

        currentTurn = [message];
        continue;
      }

      if (message.role === CHAT_ROLES.ASSISTANT && currentTurn.length === 0) {
        // Preserve an orphaned assistant message as its own unit.
        currentTurn = [message];
        continue;
      }

      if (currentTurn.length > 0) {
        currentTurn.push(message);
      } else {
        prefix.push(message);
      }
    }

    if (currentTurn.length > 0) {
      turns.push(currentTurn);
    }

    return { prefix, turns };
  }

  private messageTooLarge(): BadRequestException {
    return new BadRequestException(
      'This message is too large to fit in the model context window. Shorten it and try again.',
    );
  }
}
