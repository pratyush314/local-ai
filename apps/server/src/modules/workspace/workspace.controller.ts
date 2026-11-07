import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import {
  createWorkspaceDirectorySchema,
  updateWorkspaceDirectorySchema,
  workspaceDirectoryIdSchema,
  type CreateWorkspaceDirectoryInput,
  type UpdateWorkspaceDirectoryInput,
} from '@local-ai/contracts/workspace';
import { projectIdSchema } from '@local-ai/contracts/project';

import { WorkspaceService } from './workspace.service.js';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

@Controller()
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('projects/:projectId/workspace-directories')
  registerDirectory(
    @Param('projectId', new ZodValidationPipe(projectIdSchema))
    projectId: string,

    @Body(new ZodValidationPipe(createWorkspaceDirectorySchema))
    input: CreateWorkspaceDirectoryInput,
  ) {
    return this.workspaceService.registerDirectory(projectId, input);
  }

  @Get('projects/:projectId/workspace-directories')
  getDirectories(
    @Param('projectId', new ZodValidationPipe(projectIdSchema))
    projectId: string,
  ) {
    return this.workspaceService.getDirectories(projectId);
  }

  // Keep the more specific route before the :directoryId route.
  @Get('workspace-directories/:directoryId/availability')
  checkDirectoryAvailability(
    @Param('directoryId', new ZodValidationPipe(workspaceDirectoryIdSchema))
    directoryId: string,
  ) {
    return this.workspaceService.checkDirectoryAvailability(directoryId);
  }

  @Get('workspace-directories/:directoryId')
  getDirectory(
    @Param('directoryId', new ZodValidationPipe(workspaceDirectoryIdSchema))
    directoryId: string,
  ) {
    return this.workspaceService.getDirectory(directoryId);
  }

  @Patch('workspace-directories/:directoryId')
  updateDirectory(
    @Param('directoryId', new ZodValidationPipe(workspaceDirectoryIdSchema))
    directoryId: string,

    @Body(new ZodValidationPipe(updateWorkspaceDirectorySchema))
    input: UpdateWorkspaceDirectoryInput,
  ) {
    return this.workspaceService.updateDirectory(directoryId, input);
  }

  @Delete('workspace-directories/:directoryId')
  removeDirectory(
    @Param('directoryId', new ZodValidationPipe(workspaceDirectoryIdSchema))
    directoryId: string,
  ) {
    return this.workspaceService.removeDirectory(directoryId);
  }
}
