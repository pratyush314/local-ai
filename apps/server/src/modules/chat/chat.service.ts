import { ConflictException, Injectable, Logger } from '@nestjs/common';

import type {
  ChatStreamEvent,
  ContinueChatInput,
  StartChatInput,
} from '@local-ai/contracts/chat';

import { CHAT_ROLES, MESSAGE_STATUS } from '@local-ai/constants/chat';

import { ConversationsService } from '../conversations/conversations.service';
import { LlmService } from '../llm/llm.service';
import type { LlmMessage } from '../llm/types/llm-message.type';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  /**
   * Tracks conversations that currently have an active generation.
   *
   * This is intentionally in-memory because the application currently
   * runs as a single NestJS process.
   */
  private readonly activeGenerations = new Set<string>();

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly llmService: LlmService,
  ) {}

  /**
   * Creates a conversation and reserves it for generation.
   *
   * The reservation happens before the controller opens the SSE response.
   */
  async prepareStartChat(): Promise<{
    conversationId: string;
    stream: (
      input: StartChatInput,
      signal?: AbortSignal,
    ) => AsyncIterable<ChatStreamEvent>;
  }> {
    const conversation = await this.conversationsService.createConversation();

    this.acquireGeneration(conversation.id);

    return {
      conversationId: conversation.id,
      stream: (input, signal) =>
        this.startChatStream(conversation.id, input, signal),
    };
  }

  /**
   * Verifies the conversation and reserves it for generation.
   *
   * If another generation is already running, this throws ConflictException
   * before the SSE response is opened.
   */
  async prepareContinueChat(conversationId: string): Promise<{
    stream: (
      input: ContinueChatInput,
      signal?: AbortSignal,
    ) => AsyncIterable<ChatStreamEvent>;
  }> {
    await this.conversationsService.getConversation(conversationId);

    this.acquireGeneration(conversationId);

    return {
      stream: (input, signal) =>
        this.continueChatStream(conversationId, input, signal),
    };
  }

  private async *startChatStream(
    conversationId: string,
    input: StartChatInput,
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamEvent> {
    yield {
      type: 'conversation',
      conversationId,
    };

    yield* this.sendMessage(conversationId, input.content, {
      signal,
      shouldGenerateTitle: true,
    });
  }

  private async *continueChatStream(
    conversationId: string,
    input: ContinueChatInput,
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamEvent> {
    yield* this.sendMessage(conversationId, input.content, {
      signal,
      shouldGenerateTitle: false,
    });
  }

  private async *sendMessage(
    conversationId: string,
    content: string,
    options?: {
      signal?: AbortSignal;
      shouldGenerateTitle?: boolean;
    },
  ): AsyncIterable<ChatStreamEvent> {
    const { signal, shouldGenerateTitle = false } = options ?? {};

    try {
      const userMessage = await this.messagesService.create({
        id: crypto.randomUUID(),
        conversationId,
        role: CHAT_ROLES.USER,
        content,
        status: MESSAGE_STATUS.COMPLETED,
      });

      await this.conversationsService.touchConversation(conversationId);

      yield {
        type: 'message',
        messageId: userMessage.id,
        role: CHAT_ROLES.USER,
      };

      const assistantMessage = await this.messagesService.create({
        id: crypto.randomUUID(),
        conversationId,
        role: CHAT_ROLES.ASSISTANT,
        content: '',
        status: MESSAGE_STATUS.PENDING,
      });

      yield {
        type: 'message',
        messageId: assistantMessage.id,
        role: CHAT_ROLES.ASSISTANT,
      };

      await this.messagesService.updateStatus(
        assistantMessage.id,
        MESSAGE_STATUS.STREAMING,
      );

      let generatedContent = '';

      try {
        const messages = await this.buildLlmMessages(conversationId);

        for await (const event of this.llmService.stream({
          messages,
          signal,
        })) {
          if (event.type === 'token') {
            generatedContent += event.content;

            yield {
              type: 'token',
              content: event.content,
            };

            continue;
          }

          if (event.type === 'error') {
            throw new Error(event.message);
          }

          if (event.type === 'done') {
            break;
          }
        }

        await this.messagesService.update(assistantMessage.id, {
          content: generatedContent,
          status: MESSAGE_STATUS.COMPLETED,
        });

        await this.conversationsService.touchConversation(conversationId);

        yield {
          type: 'done',
          messageId: assistantMessage.id,
        };

        /**
         * Title generation is post-processing.
         *
         * It must never turn an already completed assistant message
         * into a failed message.
         */
        if (shouldGenerateTitle && !signal?.aborted) {
          try {
            const title = await this.llmService.generateTitle(content, signal);

            if (title) {
              await this.conversationsService.updateConversationTitle(
                conversationId,
                title,
              );

              yield {
                type: 'conversation_updated',
                conversationId,
                title,
              };
            }
          } catch (error) {
            if (signal?.aborted) {
              this.logger.debug(
                `Title generation aborted for conversation ${conversationId}`,
              );
            } else {
              this.logger.warn(
                `Title generation failed for conversation ${conversationId}: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
              );
            }
          }
        }
      } catch (error) {
        if (signal?.aborted) {
          await this.messagesService.update(assistantMessage.id, {
            content: generatedContent,
            status: MESSAGE_STATUS.CANCELLED,
          });

          yield {
            type: 'cancelled',
            messageId: assistantMessage.id,
          };

          return;
        }

        await this.messagesService.update(assistantMessage.id, {
          content: generatedContent,
          status: MESSAGE_STATUS.FAILED,
        });

        yield {
          type: 'error',
          message:
            error instanceof Error ? error.message : 'Chat generation failed',
        };
      }
    } finally {
      /**
       * The reservation is released regardless of:
       *
       * - successful generation
       * - LLM failure
       * - cancellation
       * - database failure
       * - client disconnect
       */
      this.releaseGeneration(conversationId);
    }
  }

  private acquireGeneration(conversationId: string): void {
    if (this.activeGenerations.has(conversationId)) {
      throw new ConflictException(
        'A response is already being generated for this conversation',
      );
    }

    this.activeGenerations.add(conversationId);
  }

  private releaseGeneration(conversationId: string): void {
    this.activeGenerations.delete(conversationId);
  }

  private async buildLlmMessages(
    conversationId: string,
  ): Promise<LlmMessage[]> {
    const messages =
      await this.messagesService.findByConversationId(conversationId);

    return messages
      .filter(
        (message) =>
          message.status === MESSAGE_STATUS.COMPLETED &&
          message.content.trim().length > 0,
      )
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));
  }
}
