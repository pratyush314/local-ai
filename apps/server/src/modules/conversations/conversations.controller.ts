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
  CreateConversationInput,
  createConversationSchema,
} from '@local-ai/contracts/conversation';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  createConversation(
    @Body(new ZodValidationPipe(createConversationSchema))
    input: CreateConversationInput,
  ) {
    return this.conversationsService.createConversation(input.projectId);
  }

  @Get()
  getConversations() {
    return this.conversationsService.getConversations();
  }

  @Get(':id')
  getConversation(@Param('id') id: string) {
    return this.conversationsService.getConversation(id);
  }

  @Get('/project/:projectId')
  getConversationsByProject(@Param('projectId') id: string) {
    return this.conversationsService.getProjectConversations(id);
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
