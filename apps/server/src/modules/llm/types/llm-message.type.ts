import type { ChatRole } from '@local-ai/constants/chat';

export type LlmMessageRole = ChatRole;

export interface LlmMessage {
  role: LlmMessageRole;
  content: string;
}
