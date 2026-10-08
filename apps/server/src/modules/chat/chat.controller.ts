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

import {
  canWrite,
  setupSseResponse,
} from '../../common/lib/streams/stream.lib.js';

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
  async continueChat(
    @Param('conversationId')
    conversationId: string,

    @Body(new ZodValidationPipe(continueChatSchema))
    input: ContinueChatInput,

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

  @Post(':conversationId/messages/:messageId/regenerate')
  async regenerateMessage(
    @Param('conversationId')
    conversationId: string,

    @Param('messageId')
    messageId: string,

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
      for await (const event of this.chatService.regenerateMessage(
        conversationId,
        messageId,
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

  @Post(':conversationId/messages/:messageId/edit')
  async editMessage(
    @Param('conversationId')
    conversationId: string,

    @Param('messageId')
    messageId: string,

    @Body(new ZodValidationPipe(editMessageSchema))
    input: EditMessageInput,

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
      for await (const event of this.chatService.editMessage(
        conversationId,
        messageId,
        input.content,
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
