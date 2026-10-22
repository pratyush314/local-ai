import { Module } from '@nestjs/common';

import { ConversationsModule } from '../conversations/conversations.module.js';
import { MessagesModule } from '../messages/messages.module.js';
import { ProjectsModule } from '../projects/projects.module.js';

import { MemoryController } from './memory.controller.js';
import { MemoryRepository } from './memory.repository.js';
import { MemoryService } from './services/memory.service.js';
import { MemoryExtractorService } from './services/memory-extractor.service.js';
import { LlmModule } from '../llm/llm.module.js';

@Module({
  imports: [ProjectsModule, MessagesModule, ConversationsModule, LlmModule],
  controllers: [MemoryController],
  providers: [MemoryRepository, MemoryService, MemoryExtractorService],
  exports: [MemoryService, MemoryExtractorService],
})
export class MemoryModule {}
