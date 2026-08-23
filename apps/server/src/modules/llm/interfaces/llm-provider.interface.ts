export type LlmMessageRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
  role: LlmMessageRole;
  content: string;
}

export interface LlmProvider {
  chat(messages: LlmMessage[]): Promise<string>;
}
