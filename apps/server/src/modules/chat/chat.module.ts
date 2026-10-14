import { Module } from '@nestjs/common';

import { ContextModule } from '../context/context.module.js';
import { ConversationsModule } from '../conversations/conversations.module.js';
import { LlmModule } from '../llm/llm.module.js';
import { MessagesModule } from '../messages/messages.module.js';

import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [ContextModule, ConversationsModule, MessagesModule, LlmModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
