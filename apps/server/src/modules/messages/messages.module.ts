import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../common/database/database.module.js';

import { MessagesRepository } from './messages.repository.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [MessagesRepository, MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
