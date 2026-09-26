import { Body, Controller, Param, Post, Res, UsePipes } from '@nestjs/common';

import {
  continueChatSchema,
  startChatSchema,
  type ContinueChatInput,
  type StartChatInput,
} from '@local-ai/contracts/chat';

import type { Response } from 'express';

import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';

import { ChatService } from './chat.service';
import { canWrite, setupSseResponse } from './lib/chat.lib';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(startChatSchema))
  async startChat(
    @Body() input: StartChatInput,
    @Res() response: Response,
  ): Promise<void> {
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

    setupSseResponse(response);

    try {
      for await (const event of this.chatService.startChat(
        input,
        abortController.signal,
      )) {
        if (!canWrite(response)) {
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
  @UsePipes(new ZodValidationPipe(continueChatSchema))
  async continueChat(
    @Param('conversationId') conversationId: string,
    @Body() input: ContinueChatInput,
    @Res() response: Response,
  ): Promise<void> {
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

    setupSseResponse(response);

    try {
      for await (const event of this.chatService.continueChat(
        conversationId,
        input,
        abortController.signal,
      )) {
        if (!canWrite(response)) {
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
}
