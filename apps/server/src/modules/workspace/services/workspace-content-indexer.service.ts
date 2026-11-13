import { Injectable, Logger } from '@nestjs/common';

import { CHAT_ROLES } from '@local-ai/constants/chat';
import { WORKSPACE_FILE_INDEX_STATUS } from '@local-ai/constants/workspace';

import { LlmService } from '../../llm/llm.service.js';

import { WorkspaceFileContentsRepository } from '../repositories/workspace-file-contents.repository.js';
import { WorkspaceFilesRepository } from '../repositories/workspace-files.repository.js';

import { WorkspaceFileService } from './workspace-file.service.js';

import type { WorkspaceContentIndexResult } from '../types/workspace-indexing.types.js';

@Injectable()
export class WorkspaceContentIndexerService {
  private readonly logger = new Logger(WorkspaceContentIndexerService.name);

  constructor(
    private readonly workspaceFilesRepository: WorkspaceFilesRepository,
    private readonly workspaceFileContentsRepository: WorkspaceFileContentsRepository,
    private readonly workspaceFileService: WorkspaceFileService,
    private readonly llmService: LlmService,
  ) {}

  async indexPendingFiles(
    workspaceDirectoryId: string,
  ): Promise<WorkspaceContentIndexResult> {
    const pendingFiles =
      await this.workspaceFilesRepository.findPendingOrFailedByDirectoryId(
        workspaceDirectoryId,
      );

    let indexed = 0;
    let failed = 0;

    for (const file of pendingFiles) {
      let content: string;
      let tokenCount: number;

      /**
       * STEP 1: Read and tokenize the file.
       *
       * WorkspaceFileService performs path validation,
       * binary detection, and UTF-8 validation.
       */
      try {
        const result = await this.workspaceFileService.readTextFile(
          workspaceDirectoryId,
          file.relativePath,
        );

        content = result.content;

        tokenCount = await this.llmService.countPromptTokens([
          {
            role: CHAT_ROLES.USER,
            content,
          },
        ]);
      } catch (error) {
        await this.workspaceFilesRepository.update(file.id, {
          indexStatus: WORKSPACE_FILE_INDEX_STATUS.FAILED,
          indexedAt: null,
        });

        failed += 1;

        this.logger.warn(
          `Failed to extract workspace file "${file.relativePath}": ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );

        continue;
      }

      /**
       * STEP 2: Store extracted content.
       *
       * If the file already has content, upsert replaces it.
       */
      await this.workspaceFileContentsRepository.upsert({
        fileId: file.id,
        content,
        tokenCount,
      });

      /**
       * STEP 3: Mark the file as indexed.
       */
      await this.workspaceFilesRepository.update(file.id, {
        indexStatus: WORKSPACE_FILE_INDEX_STATUS.INDEXED,
        indexedAt: new Date(),
      });

      indexed += 1;
    }

    const result: WorkspaceContentIndexResult = {
      workspaceDirectoryId,
      pending: pendingFiles.length,
      indexed,
      failed,
    };

    this.logger.log({
      event: 'workspace_content_indexing_completed',
      ...result,
    });

    return result;
  }
}
