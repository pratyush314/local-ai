import { Module } from '@nestjs/common';

import { AppConfigModule } from '@/common/config/app-config.module';

import { LLM_PROVIDER } from './llm.service';
import { LlmService } from './llm.service';
import { LlamaCppClient } from './providers/llama-cpp/llama-cpp.client';
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
