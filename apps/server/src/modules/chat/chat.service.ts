import { Injectable } from '@nestjs/common';

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
      signal: signal,
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
      signal: signal,
      shouldGenerateTitle: false,
    });
  }

  private async *sendMessage(
    conversationId: string,
    content: string,
    options?: { signal?: AbortSignal; shouldGenerateTitle?: boolean },
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

    await this.messagesService.updateStatus(
      assistantMessage.id,
      MESSAGE_STATUS.STREAMING,
    );

    const messages = await this.buildLlmMessages(conversationId);

    let generatedContent = '';

    try {
      for await (const event of this.llmService.stream({ messages, signal })) {
        if (event.type === 'token') {
          generatedContent += event.content;
          yield { type: 'token', content: event.content };
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

      if (shouldGenerateTitle && !signal?.aborted) {
        const title = await this.llmService.generateTitle(content);

        if (title) {
          await this.conversationsService.updateConversationTitle(
            conversationId,
            title,
          );
          yield { type: 'conversation_updated', conversationId, title };
        }
      }
      yield {
        type: 'done',
        messageId: assistantMessage.id,
      };
    } catch (error) {
      if (signal?.aborted) {
        await this.messagesService.update(assistantMessage.id, {
          content: generatedContent,
          status: MESSAGE_STATUS.CANCELLED,
        });
        yield { type: 'cancelled', messageId: assistantMessage.id };
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
