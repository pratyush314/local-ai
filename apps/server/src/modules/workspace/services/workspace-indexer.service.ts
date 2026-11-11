import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { createHash } from 'node:crypto';

import { readdir, realpath, stat, readFile } from 'node:fs/promises';

import {
  basename,
  extname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';

import {
  WORKSPACE_FILE_INDEX_STATUS,
  WORKSPACE_IGNORED_DIRECTORIES,
  WORKSPACE_IGNORED_FILES,
  WORKSPACE_INDEXING,
  WORKSPACE_SPECIAL_FILENAMES,
  WORKSPACE_SUPPORTED_EXTENSIONS,
} from '@local-ai/constants/workspace';

import { WorkspaceService } from './workspace.service.js';

import type { WorkspaceScanResult } from '../types/workspace-indexing.types.js';
import { WorkspaceFilesRepository } from '../repositories/workspace-files.repository.js';
import { Dirent } from 'node:fs';

interface DiscoveredFile {
  relativePath: string;
  name: string;
  extension: string | null;
  size: number;
  modifiedAt: Date;
  contentHash: string;
}

@Injectable()
export class WorkspaceIndexerService {
  private readonly logger = new Logger(WorkspaceIndexerService.name);

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceFilesRepository: WorkspaceFilesRepository,
  ) {}

  async scanDirectory(
    workspaceDirectoryId: string,
  ): Promise<WorkspaceScanResult> {
    const directory =
      await this.workspaceService.getDirectory(workspaceDirectoryId);

    const rootPath = await this.getWorkspaceRoot(directory.path);

    const discoveredFiles: DiscoveredFile[] = [];

    let skipped = 0;

    await this.discoverFiles(rootPath, rootPath, 0, discoveredFiles, {
      incrementSkipped: () => {
        skipped += 1;
      },
    });

    const existingFiles =
      await this.workspaceFilesRepository.findByDirectoryId(
        workspaceDirectoryId,
      );

    const existingByPath = new Map(
      existingFiles.map((file) => [file.relativePath, file]),
    );

    const discoveredPaths = new Set(
      discoveredFiles.map((file) => file.relativePath),
    );

    let added = 0;
    let changed = 0;
    let unchanged = 0;

    for (const file of discoveredFiles) {
      const existing = existingByPath.get(file.relativePath);

      if (!existing) {
        await this.workspaceFilesRepository.create({
          workspaceDirectoryId,
          relativePath: file.relativePath,
          name: file.name,
          extension: file.extension,
          size: file.size,
          modifiedAt: file.modifiedAt,
          contentHash: file.contentHash,
          indexStatus: WORKSPACE_FILE_INDEX_STATUS.PENDING,
          indexedAt: null,
        });

        added += 1;
        continue;
      }

      const contentChanged = existing.contentHash !== file.contentHash;

      if (contentChanged) {
        await this.workspaceFilesRepository.update(existing.id, {
          name: file.name,
          extension: file.extension,
          size: file.size,
          modifiedAt: file.modifiedAt,
          contentHash: file.contentHash,
          indexStatus: WORKSPACE_FILE_INDEX_STATUS.PENDING,
          indexedAt: null,
        });

        changed += 1;
        continue;
      }

      // Preserve indexStatus and indexedAt for unchanged content.
      // Refresh metadata in case only filesystem timestamps changed.
      if (
        existing.size !== file.size ||
        existing.modifiedAt.getTime() !== file.modifiedAt.getTime()
      ) {
        await this.workspaceFilesRepository.update(existing.id, {
          size: file.size,
          modifiedAt: file.modifiedAt,
        });
      }

      unchanged += 1;
    }

    const removedIds = existingFiles
      .filter((file) => !discoveredPaths.has(file.relativePath))
      .map((file) => file.id);

    await this.workspaceFilesRepository.deleteByIds(removedIds);

    const result: WorkspaceScanResult = {
      workspaceDirectoryId,
      discovered: discoveredFiles.length,
      added,
      changed,
      unchanged,
      removed: removedIds.length,
      skipped,
    };

    this.logger.log({
      event: 'workspace_scan_completed',
      ...result,
    });

    return result;
  }

  private async discoverFiles(
    rootPath: string,
    currentPath: string,
    depth: number,
    discoveredFiles: DiscoveredFile[],
    options: {
      incrementSkipped: () => void;
    },
  ): Promise<void> {
    if (depth > WORKSPACE_INDEXING.MAX_SCAN_DEPTH) {
      options.incrementSkipped();
      return;
    }

    let entries: Dirent[];

    try {
      entries = await readdir(currentPath, {
        withFileTypes: true,
      });
    } catch {
      throw new BadRequestException('Unable to scan a workspace directory');
    }

    for (const entry of entries) {
      if (discoveredFiles.length >= WORKSPACE_INDEXING.MAX_FILES_PER_SCAN) {
        throw new BadRequestException(
          `Workspace scan exceeded the limit of ${WORKSPACE_INDEXING.MAX_FILES_PER_SCAN} files`,
        );
      }

      const entryPath = resolve(currentPath, entry.name);

      if (entry.isSymbolicLink()) {
        options.incrementSkipped();
        continue;
      }

      if (entry.isDirectory()) {
        if (WORKSPACE_IGNORED_DIRECTORIES.has(entry.name)) {
          options.incrementSkipped();
          continue;
        }

        await this.discoverFiles(
          rootPath,
          entryPath,
          depth + 1,
          discoveredFiles,
          options,
        );

        continue;
      }

      if (!entry.isFile()) {
        options.incrementSkipped();
        continue;
      }

      if (!this.isSupportedFile(entry.name)) {
        options.incrementSkipped();
        continue;
      }

      try {
        const canonicalPath = await realpath(entryPath);

        if (!this.isInsideRoot(rootPath, canonicalPath)) {
          options.incrementSkipped();
          continue;
        }

        const fileStats = await stat(canonicalPath);

        if (fileStats.size > WORKSPACE_INDEXING.MAX_FILE_SIZE_BYTES) {
          options.incrementSkipped();
          continue;
        }

        const buffer = await readFile(canonicalPath);

        // Reject binary content before hashing/accepting it as text.
        if (buffer.includes(0)) {
          options.incrementSkipped();
          continue;
        }

        const relativePath = relative(rootPath, canonicalPath)
          .split(sep)
          .join('/');

        discoveredFiles.push({
          relativePath,
          name: basename(canonicalPath),
          extension: extname(canonicalPath) || null,
          size: buffer.byteLength,
          modifiedAt: fileStats.mtime,
          contentHash: createHash('sha256').update(buffer).digest('hex'),
        });
      } catch {
        // A file may disappear or become inaccessible during scanning.
        // Do not treat it as deleted until a complete scan succeeds.
        options.incrementSkipped();
      }
    }
  }

  private isSupportedFile(name: string): boolean {
    if (WORKSPACE_IGNORED_FILES.has(name)) {
      return false;
    }

    if (WORKSPACE_SPECIAL_FILENAMES.has(name)) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return WORKSPACE_SUPPORTED_EXTENSIONS.has(extname(name).toLowerCase());
  }

  private async getWorkspaceRoot(directoryPath: string): Promise<string> {
    try {
      const rootPath = await realpath(directoryPath);
      const rootStats = await stat(rootPath);

      if (!rootStats.isDirectory()) {
        throw new BadRequestException(
          'Registered workspace path is not a directory',
        );
      }

      return rootPath;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new NotFoundException(
        'Registered workspace directory is unavailable',
      );
    }
  }

  private isInsideRoot(rootPath: string, targetPath: string): boolean {
    const relativePath = relative(rootPath, targetPath);

    return (
      relativePath !== '..' &&
      !relativePath.startsWith(`..${sep}`) &&
      !isAbsolute(relativePath)
    );
  }
}
