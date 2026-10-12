import { ChatStreamEvent } from '@local-ai/contracts';
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

async function streamEvents(
  response: Response,
  stream: AsyncIterable<ChatStreamEvent>,
  abortController: AbortController,
): Promise<void> {
  const handleResponseClose = () => {
    if (!response.writableEnded) {
      abortController.abort();
    }
  };

  const iterator = stream[Symbol.asyncIterator]();
  let sseStarted = false;

  response.on('close', handleResponseClose);

  try {
    // Execute the generator before committing SSE headers.
    // A ConflictException here can still become HTTP 409.
    const first = await iterator.next();

    if (first.done) {
      response.status(200).end();
      return;
    }

    // Only successful streams reach this point.
    response.status(200);
    setupSseResponse(response);
    sseStarted = true;

    if (canWrite(response)) {
      response.write(`data: ${JSON.stringify(first.value)}\n\n`);
    }

    while (canWrite(response)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { value, done } = await iterator.next();

      if (done) {
        break;
      }

      if (canWrite(response)) {
        response.write(`data: ${JSON.stringify(value)}\n\n`);
      }
    }
  } catch (error) {
    if (!sseStarted) {
      // Let NestJS format the normal HTTP error response.
      throw error;
    }

    // Once SSE has started, HTTP status can no longer be changed.
    if (canWrite(response)) {
      response.write(
        `data: ${JSON.stringify({
          type: 'error',
          message:
            error instanceof Error ? error.message : 'Chat generation failed',
        })}\n\n`,
      );
    }
  } finally {
    response.off('close', handleResponseClose);

    // Closing the iterator runs the service generator's finally block,
    // releasing its generation lock when a client disconnects.
    try {
      await iterator.return?.();
    } catch {
      // Preserve the original stream error.
    }

    if (sseStarted && !response.writableEnded && !response.destroyed) {
      response.end();
    }
  }
}

export { setupSseResponse, canWrite, streamEvents };
