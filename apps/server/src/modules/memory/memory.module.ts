import { Module } from '@nestjs/common';

import { MessagesModule } from '../messages/messages.module.js';
import { ProjectsModule } from '../projects/projects.module.js';

import { MemoryRepository } from './memory.repository.js';
import { MemoryService } from './memory.service.js';

@Module({
  imports: [ProjectsModule, MessagesModule],
  providers: [MemoryRepository, MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
