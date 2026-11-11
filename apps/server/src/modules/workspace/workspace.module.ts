import { Module } from '@nestjs/common';

import { ProjectsModule } from '../projects/projects.module.js';

import { WorkspaceController } from './workspace.controller.js';
import { WorkspaceRepository } from './repositories/workspace.repository.js';
import { WorkspaceService } from './services/workspace.service.js';
import { WorkspaceFileService } from './services/workspace-file.service.js';
import { WorkspaceFilesRepository } from './repositories/workspace-files.repository.js';
import { WorkspaceIndexerService } from './services/workspace-indexer.service.js';

@Module({
  imports: [ProjectsModule],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceRepository,
    WorkspaceService,
    WorkspaceFileService,
    WorkspaceFilesRepository,
    WorkspaceIndexerService,
  ],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
