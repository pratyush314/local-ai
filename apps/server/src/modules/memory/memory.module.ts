import { Module } from '@nestjs/common';

import { ConversationsModule } from '../conversations/conversations.module.js';
import { MessagesModule } from '../messages/messages.module.js';
import { ProjectsModule } from '../projects/projects.module.js';

import { MemoryController } from './memory.controller.js';
import { MemoryRepository } from './memory.repository.js';
import { MemoryService } from './memory.service.js';

@Module({
  imports: [ProjectsModule, MessagesModule, ConversationsModule],
  controllers: [MemoryController],
  providers: [MemoryRepository, MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
