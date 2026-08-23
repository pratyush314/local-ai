import { Body, Controller, Post } from '@nestjs/common';

import { LlmService } from './llm.service';
import { LlmTestDto } from './dto/llm-test.dto';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Post('test')
  async test(@Body() dto: LlmTestDto) {
    const response = await this.llmService.chat([
      {
        role: 'user',
        content: dto.message,
      },
    ]);

    return {
      response,
    };
  }
}
