import { Module } from '@nestjs/common';

import { ConversationsController } from './conversations.controller.js';
import { ConversationsRepository } from './conversations.repository.js';
import { ConversationsService } from './conversations.service.js';
import { DatabaseModule } from '../../common/database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [ConversationsController],
  providers: [ConversationsRepository, ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
