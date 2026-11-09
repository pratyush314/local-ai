import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  createWorkspaceDirectorySchema,
  updateWorkspaceDirectorySchema,
  workspaceDirectoryIdSchema,
  workspaceDirectoryPathQuerySchema,
  workspaceFileContentQuerySchema,
  type CreateWorkspaceDirectoryInput,
  type UpdateWorkspaceDirectoryInput,
  type WorkspaceDirectoryPathQuery,
  type WorkspaceFileContentQuery,
} from '@local-ai/contracts/workspace';
import { projectIdSchema } from '@local-ai/contracts/project';

import { WorkspaceFileService } from './services/workspace-file.service.js';
import { WorkspaceService } from './services/workspace.service.js';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

@Controller()
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceFileService: WorkspaceFileService,
  ) {}

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

  // ---------------------------------------------------------
  // Workspace file browsing
  // Keep these routes before the generic :directoryId route.
  // ---------------------------------------------------------

  @Get('workspace-directories/:directoryId/files/content')
  readTextFile(
    @Param('directoryId', new ZodValidationPipe(workspaceDirectoryIdSchema))
    directoryId: string,

    @Query(new ZodValidationPipe(workspaceFileContentQuerySchema))
    query: WorkspaceFileContentQuery,
  ) {
    return this.workspaceFileService.readTextFile(directoryId, query.path);
  }

  @Get('workspace-directories/:directoryId/files')
  listDirectory(
    @Param('directoryId', new ZodValidationPipe(workspaceDirectoryIdSchema))
    directoryId: string,

    @Query(new ZodValidationPipe(workspaceDirectoryPathQuerySchema))
    query: WorkspaceDirectoryPathQuery,
  ) {
    return this.workspaceFileService.listDirectory(
      directoryId,
      query.path ?? '',
    );
  }

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
