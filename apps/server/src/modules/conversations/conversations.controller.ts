import { Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  createConversation() {
    return this.conversationsService.createConversation();
  }

  @Get()
  getConversations() {
    return this.conversationsService.getConversations();
  }

  @Get(':id')
  getConversation(@Param('id') id: string) {
    return this.conversationsService.getConversation(id);
  }

  @Delete(':id')
  async deleteConversation(@Param('id') id: string) {
    await this.conversationsService.deleteConversation(id);

    return {
      success: true,
    };
  }
}
