import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../common/config/app-config.module.js';
import { LlmModule } from '../llm/llm.module.js';

import { ContextService } from './context.service.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';

@Module({
  imports: [AppConfigModule, LlmModule, WorkspaceModule],
  providers: [ContextService],
  exports: [ContextService],
})
export class ContextModule {}
