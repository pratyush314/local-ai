import { Module } from '@nestjs/common';

import { AppConfigModule } from '../../common/config/app-config.module.js';

import { LlamaCppClient } from './clients/llama-cpp/llama-cpp.client.js';
import { LlmService, LLM_PROVIDER } from './llm.service.js';
import { LlamaCppProvider } from './providers/llama-cpp/llama-cpp.provider.js';
import { LlmController } from './llm.controller.js';

@Module({
  imports: [AppConfigModule],
  controllers: [LlmController],
  providers: [
    LlmService,
    LlamaCppClient,
    LlamaCppProvider,
    {
      provide: LLM_PROVIDER,
      useExisting: LlamaCppProvider,
    },
  ],
  exports: [LlmService],
})
export class LlmModule {}
