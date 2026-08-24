import { Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

import { LlmService } from './llm.service';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('test')
  async test(@Req() request: Request, @Res() response: Response) {
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
      for await (const event of this.llmService.stream({
        messages: [
          {
            role: 'user',
            content: 'Explain dependency injection in NestJS in one paragraph.',
          },
        ],
        signal: abortController.signal,
      })) {
        response.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        response.write(
          `data: ${JSON.stringify({
            type: 'error',
            message:
              error instanceof Error ? error.message : 'LLM generation failed',
          })}\n\n`,
        );
      }
    } finally {
      request.off('close', abortGeneration);

      if (!response.writableEnded) {
        response.end();
      }
    }
  }
}
