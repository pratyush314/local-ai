export type LlmStreamEvent =
  | {
      type: 'token';
      content: string;
    }
  | {
      type: 'done';
    }
  | {
      type: 'error';
      message: string;
    };
