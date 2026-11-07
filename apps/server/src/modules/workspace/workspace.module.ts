import { Module } from '@nestjs/common';

import { ProjectsModule } from '../projects/projects.module.js';

import { WorkspaceController } from './workspace.controller.js';
import { WorkspaceRepository } from './workspace.repository.js';
import { WorkspaceService } from './workspace.service.js';

@Module({
  imports: [ProjectsModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceRepository, WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
