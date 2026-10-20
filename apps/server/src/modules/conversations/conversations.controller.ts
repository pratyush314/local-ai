import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ConversationsService } from './conversations.service.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  AssignConversationProjectInput,
  assignConversationProjectSchema,
} from '@local-ai/contracts';

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

  @Patch(':conversationId/project')
  assignProject(
    @Param('conversationId') conversationId: string,

    @Body(new ZodValidationPipe(assignConversationProjectSchema))
    input: AssignConversationProjectInput,
  ) {
    return this.conversationsService.assignProject(
      conversationId,
      input.projectId,
    );
  }

  @Delete(':conversationId/project')
  unassignProject(@Param('conversationId') conversationId: string) {
    return this.conversationsService.assignProject(conversationId, null);
  }
}
