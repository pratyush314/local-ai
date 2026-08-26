import { Body, Controller, Param, Post, Req, Res } from '@nestjs/common';

import type {
  ContinueChatInput,
  StartChatInput,
} from '@local-ai/contracts/chat';

import type { Request, Response } from 'express';

import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async startChat(
    @Body() input: StartChatInput,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const abortController = new AbortController();

    const abortGeneration = () => {
      abortController.abort();
    };

    request.on('close', abortGeneration);

    response.setHeader('Content-Type', 'text/event-stream');

    response.setHeader('Cache-Control', 'no-cache');

    response.setHeader('Connection', 'keep-alive');

    response.flushHeaders();

    try {
      for await (const event of this.chatService.startChat(
        input,
        abortController.signal,
      )) {
        response.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } finally {
      request.off('close', abortGeneration);

      if (!response.writableEnded) {
        response.end();
      }
    }
  }

  @Post(':conversationId/messages')
  async continueChat(
    @Param('conversationId') conversationId: string,
    @Body() input: ContinueChatInput,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const abortController = new AbortController();

    const abortGeneration = () => {
      abortController.abort();
    };

    request.on('close', abortGeneration);

    response.setHeader('Content-Type', 'text/event-stream');

    response.setHeader('Cache-Control', 'no-cache');

    response.setHeader('Connection', 'keep-alive');

    response.flushHeaders();

    try {
      for await (const event of this.chatService.continueChat(
        conversationId,
        input,
        abortController.signal,
      )) {
        response.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } finally {
      request.off('close', abortGeneration);

      if (!response.writableEnded) {
        response.end();
      }
    }
  }
}
