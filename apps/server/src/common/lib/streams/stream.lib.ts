import { Response } from 'express';

function setupSseResponse(response: Response): void {
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('Connection', 'keep-alive');

  response.flushHeaders();
}

function canWrite(response: Response): boolean {
  return !response.writableEnded && !response.destroyed;
}

export { setupSseResponse, canWrite };
