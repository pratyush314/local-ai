import { Controller, Get, Param } from '@nestjs/common';

import { MessagesService } from './messages.service.js';

@Controller('conversations/:conversationId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  getConversationMessages(@Param('conversationId') conversationId: string) {
    return this.messagesService.findByConversationId(conversationId);
  }
}
