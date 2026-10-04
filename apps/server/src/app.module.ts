import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './common/config/app-config.module.js';
import { DatabaseModule } from './common/database/database.module.js';
import { ConversationsModule } from './modules/conversations/conversations.module.js';
import { LlmModule } from './modules/llm/llm.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { MessagesModule } from './modules/messages/messages.module.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ConversationsModule,
    MessagesModule,
    LlmModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
