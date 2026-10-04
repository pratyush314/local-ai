import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../common/database/database.module.js';

import { MessagesRepository } from './messages.repository.js';
import { MessagesService } from './messages.service.js';
import { MessagesController } from './messages.controller.js';

@Module({
  imports: [DatabaseModule],
  controllers: [MessagesController],
  providers: [MessagesRepository, MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
