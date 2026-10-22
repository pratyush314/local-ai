import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import {
  createProjectMemorySchema,
  projectMemoryIdSchema,
  updateProjectMemoryStatusSchema,
  type CreateProjectMemoryInput,
  type UpdateProjectMemoryStatusInput,
} from '@local-ai/contracts/project-memory';

import { projectIdSchema } from '@local-ai/contracts/workspace';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { MemoryService } from './services/memory.service.js';

@Controller()
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Post('memories')
  createMemory(
    @Body(new ZodValidationPipe(createProjectMemorySchema))
    input: CreateProjectMemoryInput,
  ) {
    return this.memoryService.createMemory(input);
  }

  @Get('projects/:projectId/memories')
  getProjectMemories(
    @Param('projectId', new ZodValidationPipe(projectIdSchema))
    projectId: string,
  ) {
    return this.memoryService.getProjectMemories(projectId);
  }

  @Get('memories/:memoryId')
  getMemory(
    @Param('memoryId', new ZodValidationPipe(projectMemoryIdSchema))
    memoryId: string,
  ) {
    return this.memoryService.getMemory(memoryId);
  }

  @Patch('memories/:memoryId/status')
  updateMemoryStatus(
    @Param('memoryId', new ZodValidationPipe(projectMemoryIdSchema))
    memoryId: string,

    @Body(new ZodValidationPipe(updateProjectMemoryStatusSchema))
    input: UpdateProjectMemoryStatusInput,
  ) {
    return this.memoryService.updateMemoryStatus(memoryId, input.status);
  }
}
