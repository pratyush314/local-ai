import { Module } from '@nestjs/common';

import { AppConfigModule } from '@/common/config/app-config.module';

import { LlamaCppClient } from './clients/llama-cpp/llama-cpp.client';
import { LlmService, LLM_PROVIDER } from './llm.service';
import { LlamaCppProvider } from './providers/llama-cpp/llama-cpp.provider';
import { LlmController } from './llm.controller';

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
