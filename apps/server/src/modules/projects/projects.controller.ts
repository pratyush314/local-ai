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
  createProjectSchema,
  projectIdSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@local-ai/contracts/workspace';

import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  createProject(
    @Body(new ZodValidationPipe(createProjectSchema))
    input: CreateProjectInput,
  ) {
    return this.projectsService.createProject(input);
  }

  @Get()
  getProjects() {
    return this.projectsService.getProjects();
  }

  @Get(':projectId')
  getProject(
    @Param('projectId', new ZodValidationPipe(projectIdSchema))
    projectId: string,
  ) {
    return this.projectsService.getProject(projectId);
  }

  @Patch(':projectId')
  updateProject(
    @Param('projectId', new ZodValidationPipe(projectIdSchema))
    projectId: string,

    @Body(new ZodValidationPipe(updateProjectSchema))
    input: UpdateProjectInput,
  ) {
    return this.projectsService.updateProject(projectId, input);
  }

  @Delete(':projectId')
  deleteProject(
    @Param('projectId', new ZodValidationPipe(projectIdSchema))
    projectId: string,
  ) {
    return this.projectsService.deleteProject(projectId);
  }
}
