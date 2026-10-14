export interface LlamaCppResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
}

export interface LlamaCppStreamResponse {
  choices: Array<{
    delta?: {
      content?: string;
    };
    finish_reason?: string | null;
  }>;
}

export interface LlamaCppApplyTemplateResponse {
  prompt: string;
}

export interface LlamaCppTokenizeResponse {
  tokens: number[];
}
