import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../common/config/app-config.module.js';
import { LlmModule } from '../llm/llm.module.js';

import { ContextService } from './context.service.js';

@Module({
  imports: [AppConfigModule, LlmModule],
  providers: [ContextService],
  exports: [ContextService],
})
export class ContextModule {}
