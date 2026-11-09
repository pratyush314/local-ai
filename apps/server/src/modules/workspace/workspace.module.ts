import { Module } from '@nestjs/common';

import { ProjectsModule } from '../projects/projects.module.js';

import { WorkspaceController } from './workspace.controller.js';
import { WorkspaceRepository } from './workspace.repository.js';
import { WorkspaceService } from './services/workspace.service.js';
import { WorkspaceFileService } from './services/workspace-file.service.js';

@Module({
  imports: [ProjectsModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceRepository, WorkspaceService, WorkspaceFileService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
