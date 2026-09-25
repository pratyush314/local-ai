import { Injectable, Logger } from '@nestjs/common';

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

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly llmService: LlmService,
  ) {}

  async *startChat(
    input: StartChatInput,
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamEvent> {
    const conversation = await this.conversationsService.createConversation();

    yield {
      type: 'conversation',
      conversationId: conversation.id,
    };

    yield* this.sendMessage(conversation.id, input.content, {
      signal,
      shouldGenerateTitle: true,
    });
  }

  async *continueChat(
    conversationId: string,
    input: ContinueChatInput,
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamEvent> {
    await this.conversationsService.getConversation(conversationId);

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

    let generatedContent = '';

    try {
      /*
       * Build the context before marking the assistant as streaming.
       * If context preparation fails, the assistant remains PENDING
       * instead of being incorrectly marked as STREAMING.
       */
      const messages = await this.buildLlmMessages(conversationId);

      await this.messagesService.updateStatus(
        assistantMessage.id,
        MESSAGE_STATUS.STREAMING,
      );

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

        if (event.type === 'done') {
          break;
        }

        if (event.type === 'error') {
          throw new Error(event.message);
        }
      }

      await this.messagesService.update(assistantMessage.id, {
        content: generatedContent,
        status: MESSAGE_STATUS.COMPLETED,
      });

      await this.conversationsService.touchConversation(conversationId);

      /*
       * The assistant generation itself is now complete.
       * Emit done before performing optional post-processing.
       */
      yield {
        type: 'done',
        messageId: assistantMessage.id,
      };

      /*
       * Title generation is independent from assistant generation.
       * A title failure must never turn a successful assistant
       * response into a FAILED message.
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
            return;
          }

          this.logger.warn(
            `Failed to generate title for conversation "${conversationId}": ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
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

      this.logger.error(
        `Chat generation failed for conversation "${conversationId}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      yield {
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Chat generation failed',
      };
    }
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
