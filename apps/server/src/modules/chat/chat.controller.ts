import { Body, Controller, Param, Post, Res } from '@nestjs/common';

import {
  continueChatSchema,
  editMessageSchema,
  startChatSchema,
  type ContinueChatInput,
  type EditMessageInput,
  type StartChatInput,
} from '@local-ai/contracts/chat';

import type { Response } from 'express';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

import { streamEvents } from '../../common/lib/streams/stream.lib.js';

import { ChatService } from './chat.service.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  startChat(
    @Body(new ZodValidationPipe(startChatSchema))
    input: StartChatInput,
    @Res() response: Response,
  ): Promise<void> {
    const abortController = new AbortController();

    return streamEvents(
      response,
      this.chatService.startChat(input, abortController.signal),
      abortController,
    );
  }

  @Post(':conversationId/messages')
  continueChat(
    @Param('conversationId')
    conversationId: string,

    @Body(new ZodValidationPipe(continueChatSchema))
    input: ContinueChatInput,

    @Res() response: Response,
  ): Promise<void> {
    const abortController = new AbortController();

    return streamEvents(
      response,
      this.chatService.continueChat(
        conversationId,
        input,
        abortController.signal,
      ),
      abortController,
    );
  }

  @Post(':conversationId/messages/:messageId/regenerate')
  regenerateMessage(
    @Param('conversationId')
    conversationId: string,

    @Param('messageId')
    messageId: string,

    @Res() response: Response,
  ): Promise<void> {
    const abortController = new AbortController();

    return streamEvents(
      response,
      this.chatService.regenerateMessage(
        conversationId,
        messageId,
        abortController.signal,
      ),
      abortController,
    );
  }

  @Post(':conversationId/messages/:messageId/edit')
  editMessage(
    @Param('conversationId')
    conversationId: string,

    @Param('messageId')
    messageId: string,

    @Body(new ZodValidationPipe(editMessageSchema))
    input: EditMessageInput,

    @Res() response: Response,
  ): Promise<void> {
    const abortController = new AbortController();

    return streamEvents(
      response,
      this.chatService.editMessage(
        conversationId,
        messageId,
        input.content,
        abortController.signal,
      ),
      abortController,
    );
  }
}
