import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import type {
  ChatStreamEvent,
  ContinueChatInput,
  StartChatInput,
} from '@local-ai/contracts/chat';

import { CHAT_ROLES, MESSAGE_STATUS } from '@local-ai/constants/chat';

import { ConversationsService } from '../conversations/conversations.service.js';
import { LlmService } from '../llm/llm.service.js';
import type { LlmMessage } from '../llm/types/llm-message.type.js';
import { MessagesService } from '../messages/messages.service.js';
import { ContextService } from '../context/context.service.js';
import { MemoryService } from '../memory/services/memory.service.js';
import { MemoryExtractorService } from '../memory/services/memory-extractor.service.js';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  private readonly activeGenerations = new Set<string>();

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
    private readonly llmService: LlmService,
    private readonly contextService: ContextService,
    private readonly memoryService: MemoryService,
    private readonly memoryExtractorService: MemoryExtractorService,
  ) {}

  async *startChat(
    input: StartChatInput,
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamEvent> {
    const conversation = await this.conversationsService.createConversation();

    this.acquireGeneration(conversation.id);

    try {
      yield {
        type: 'conversation',
        conversationId: conversation.id,
      };

      const userMessage = await this.messagesService.create({
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        role: CHAT_ROLES.USER,
        content: input.content,
        status: MESSAGE_STATUS.COMPLETED,
      });

      await this.conversationsService.touchConversation(conversation.id);

      yield {
        type: 'message',
        messageId: userMessage.id,
        role: CHAT_ROLES.USER,
      };

      yield* this.generateAssistantResponse(
        conversation.id,
        userMessage.id,
        input.content,
        signal,
        true,
      );
    } finally {
      this.releaseGeneration(conversation.id);
    }
  }

  async *continueChat(
    conversationId: string,
    input: ContinueChatInput,
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamEvent> {
    await this.conversationsService.getConversation(conversationId);

    this.acquireGeneration(conversationId);

    try {
      const userMessage = await this.messagesService.create({
        id: crypto.randomUUID(),
        conversationId,
        role: CHAT_ROLES.USER,
        content: input.content,
        status: MESSAGE_STATUS.COMPLETED,
      });

      await this.conversationsService.touchConversation(conversationId);

      yield {
        type: 'message',
        messageId: userMessage.id,
        role: CHAT_ROLES.USER,
      };

      yield* this.generateAssistantResponse(
        conversationId,
        userMessage.id,
        input.content,
        signal,
        false,
      );
    } finally {
      this.releaseGeneration(conversationId);
    }
  }

  async *regenerateMessage(
    conversationId: string,
    messageId: string,
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamEvent> {
    await this.conversationsService.getConversation(conversationId);

    this.acquireGeneration(conversationId);

    try {
      const target = await this.messagesService.findById(messageId);

      this.assertMessageBelongsToConversation(target, conversationId);

      if (target.role !== CHAT_ROLES.ASSISTANT) {
        throw new BadRequestException(
          'Only assistant messages can be regenerated',
        );
      }

      const messages =
        await this.messagesService.findByConversationId(conversationId);

      const targetIndex = messages.findIndex(
        (message) => message.id === target.id,
      );

      if (targetIndex <= 0) {
        throw new BadRequestException(
          'Cannot regenerate this assistant message because its preceding user message was not found',
        );
      }

      const precedingUserMessage = messages[targetIndex - 1];

      if (precedingUserMessage.role !== CHAT_ROLES.USER) {
        throw new BadRequestException(
          'Assistant message must immediately follow a user message',
        );
      }

      await this.messagesService.deleteFromSequence(
        conversationId,
        target.sequence,
      );

      await this.conversationsService.touchConversation(conversationId);

      const isFirstMessage = target.sequence === 1;

      yield* this.generateAssistantResponse(
        conversationId,
        precedingUserMessage.id,
        precedingUserMessage.content,
        signal,
        isFirstMessage,
      );
    } finally {
      this.releaseGeneration(conversationId);
    }
  }

  async *editMessage(
    conversationId: string,
    messageId: string,
    content: string,
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamEvent> {
    await this.conversationsService.getConversation(conversationId);

    this.acquireGeneration(conversationId);

    try {
      const target = await this.messagesService.findById(messageId);

      this.assertMessageBelongsToConversation(target, conversationId);

      if (target.role !== CHAT_ROLES.USER) {
        throw new BadRequestException('Only user messages can be edited');
      }

      const normalizedContent = content.trim();

      if (!normalizedContent) {
        throw new BadRequestException('Message content cannot be empty');
      }

      const updatedMessage = this.messagesService.editAndDeleteAfter(
        conversationId,
        target.id,
        target.sequence,
        normalizedContent,
      );

      await this.conversationsService.touchConversation(conversationId);

      yield {
        type: 'message',
        messageId: updatedMessage.id,
        role: CHAT_ROLES.USER,
      };

      const isFirstMessage = target.sequence === 1;

      yield* this.generateAssistantResponse(
        conversationId,
        updatedMessage.id,
        normalizedContent,
        signal,
        isFirstMessage,
      );
    } finally {
      this.releaseGeneration(conversationId);
    }
  }

  private async *generateAssistantResponse(
    conversationId: string,
    userMessageId: string,
    userContent: string,
    signal?: AbortSignal,
    shouldGenerateTitle = false,
  ): AsyncIterable<ChatStreamEvent> {
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

      const projectMemoryContext = await this.buildProjectMemoryContext(
        conversationId,
        messages,
      );

      const messagesWithMemory: LlmMessage[] = projectMemoryContext
        ? [
            {
              role: CHAT_ROLES.SYSTEM,
              content: projectMemoryContext,
            },
            ...messages,
          ]
        : messages;

      const context = await this.contextService.prepare(
        messagesWithMemory,
        signal,
      );

      for await (const event of this.llmService.stream({
        messages: context.messages,
        maxTokens: context.maxTokens,
        signal,
      })) {
        if (event.type === 'token') {
          generatedContent += event.content;

          yield {
            type: 'token',
            content: event.content,
            messageId: assistantMessage.id,
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

      // Start best-effort memory extraction without delaying the chat stream.
      void this.extractProjectMemoriesInBackground({
        conversationId,
        userMessageId,
        userContent,
        assistantResponse: generatedContent,
        signal,
      });

      yield {
        type: 'done',
        messageId: assistantMessage.id,
      };

      if (shouldGenerateTitle && !signal?.aborted) {
        const title = await this.generateConversationTitle(
          conversationId,
          userContent,
          signal,
        );

        if (title) {
          yield {
            type: 'conversation_updated',
            conversationId,
            title,
          };
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
  }

  private async generateConversationTitle(
    conversationId: string,
    content: string,
    signal?: AbortSignal,
  ): Promise<string | undefined> {
    try {
      const title = await this.llmService.generateTitle(content, signal);

      if (!title) {
        return undefined;
      }

      await this.conversationsService.updateConversationTitle(
        conversationId,
        title,
      );

      return title;
    } catch (error) {
      if (signal?.aborted) {
        this.logger.debug(
          `Title generation aborted for conversation ${conversationId}`,
        );

        return undefined;
      }

      this.logger.warn(
        `Title generation failed for conversation ${conversationId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      return undefined;
    }
  }

  private assertMessageBelongsToConversation(
    message: Awaited<ReturnType<MessagesService['findById']>>,
    conversationId: string,
  ): void {
    if (message.conversationId !== conversationId) {
      throw new NotFoundException('Message not found in this conversation');
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

  private async buildProjectMemoryContext(
    conversationId: string,
    messages: LlmMessage[],
  ): Promise<string | null> {
    const conversation =
      await this.conversationsService.getConversation(conversationId);

    if (!conversation.projectId) {
      return null;
    }

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === CHAT_ROLES.USER);

    if (!latestUserMessage) {
      return null;
    }

    const memories = await this.memoryService.retrieveRelevantMemories(
      conversation.projectId,
      latestUserMessage.content,
      8,
    );

    if (memories.length === 0) {
      return null;
    }

    this.logger.debug({
      event: 'project_memory_retrieved',
      conversationId,
      projectId: conversation.projectId,
      queryTokenCount: latestUserMessage.content
        .trim()
        .split(/\s+/)
        .filter(Boolean).length,
      retrievedCount: memories.length,
      memories: memories.map((memory) => ({
        id: memory.id,
        kind: memory.kind,
        score: Number(memory.score.toFixed(2)),
      })),
    });

    const memoryEntries = memories.map((memory, index) => {
      return [
        `${index + 1}. [${memory.kind}] ${memory.subject}`,
        memory.content,
        `Source: ${memory.sourceType}`,
        memory.sourcePath ? `File: ${memory.sourcePath}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    });

    return [
      'Relevant project memory follows.',
      'Use it as supporting context when answering questions about this project.',
      'Treat these entries as potentially useful project facts, decisions, constraints, or tasks.',
      'If a memory conflicts with the current user message or other reliable context, do not blindly follow it; explain the conflict when relevant.',
      'Do not claim to have inspected files or verified facts solely because they appear in memory.',
      '',
      ...memoryEntries,
    ].join('\n\n');
  }

  private async extractProjectMemoriesInBackground(input: {
    conversationId: string;
    userMessageId: string;
    userContent: string;
    assistantResponse: string;
    signal?: AbortSignal;
  }): Promise<void> {
    try {
      if (input.signal?.aborted) {
        return;
      }

      const conversation = await this.conversationsService.getConversation(
        input.conversationId,
      );

      if (!conversation.projectId) {
        return;
      }

      await this.memoryExtractorService.extractFromExchange({
        projectId: conversation.projectId,
        userMessageId: input.userMessageId,
        userMessage: input.userContent,
        assistantResponse: input.assistantResponse,
        signal: input.signal,
      });
    } catch (error) {
      this.logger.warn(
        `Background project memory extraction failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
