import { Body, Controller, Param, Post, Res } from '@nestjs/common';

import {
  continueChatSchema,
  startChatSchema,
  type ContinueChatInput,
  type StartChatInput,
} from '@local-ai/contracts/chat';

import type { Response } from 'express';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

import { ChatService } from './chat.service.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async startChat(
    @Body(new ZodValidationPipe(startChatSchema))
    input: StartChatInput,
    @Res() response: Response,
  ): Promise<void> {
    /**
     * Reserve the generation BEFORE opening SSE.
     *
     * For a new conversation this cannot conflict because the
     * conversation is created here.
     */
    const prepared = await this.chatService.prepareStartChat();

    const abortController = new AbortController();

    const abortGeneration = () => {
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    };

    const handleResponseClose = () => {
      if (!response.writableEnded) {
        abortGeneration();
      }
    };

    response.on('close', handleResponseClose);

    this.setupSseResponse(response);

    try {
      for await (const event of prepared.stream(
        input,
        abortController.signal,
      )) {
        if (!this.canWrite(response)) {
          break;
        }

        response.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } finally {
      response.off('close', handleResponseClose);

      if (!response.writableEnded && !response.destroyed) {
        response.end();
      }
    }
  }

  @Post(':conversationId/messages')
  async continueChat(
    @Param('conversationId') conversationId: string,
    @Body(new ZodValidationPipe(continueChatSchema))
    input: ContinueChatInput,
    @Res() response: Response,
  ): Promise<void> {
    /**
     * IMPORTANT:
     *
     * This happens BEFORE setupSseResponse().
     *
     * Therefore ConflictException can still become a normal HTTP 409.
     */
    const prepared = await this.chatService.prepareContinueChat(conversationId);

    const abortController = new AbortController();

    const abortGeneration = () => {
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    };

    const handleResponseClose = () => {
      if (!response.writableEnded) {
        abortGeneration();
      }
    };

    response.on('close', handleResponseClose);

    this.setupSseResponse(response);

    try {
      for await (const event of prepared.stream(
        input,
        abortController.signal,
      )) {
        if (!this.canWrite(response)) {
          break;
        }

        response.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } finally {
      response.off('close', handleResponseClose);

      if (!response.writableEnded && !response.destroyed) {
        response.end();
      }
    }
  }

  private setupSseResponse(response: Response): void {
    response.setHeader('Content-Type', 'text/event-stream');

    response.setHeader('Cache-Control', 'no-cache');

    response.setHeader('Connection', 'keep-alive');

    response.flushHeaders();
  }

  private canWrite(response: Response): boolean {
    return !response.writableEnded && !response.destroyed;
  }
}
