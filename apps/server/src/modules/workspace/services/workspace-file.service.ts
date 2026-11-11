import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { readdir, readFile, realpath, stat } from 'node:fs/promises';

import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import type {
  WorkspaceDirectoryListing,
  WorkspaceFileContent,
  WorkspaceFileEntry,
} from '../types/workspace-file.types.js';
import { WorkspaceService } from './workspace.service.js';

import { Dirent } from 'node:fs';
import { DEFAULT_IGNORED_DIRECTORIES } from '@local-ai/constants/workspace';

const MAX_FILE_SIZE_BYTES = 1024 * 1024;

@Injectable()
export class WorkspaceFileService {
  constructor(private readonly workspaceService: WorkspaceService) {}

  async listDirectory(
    directoryId: string,
    relativePath = '',
  ): Promise<WorkspaceDirectoryListing> {
    const rootPath = await this.getWorkspaceRoot(directoryId);

    const targetPath = await this.resolveWorkspacePath(rootPath, relativePath);

    let entries: Dirent[];

    try {
      entries = await readdir(targetPath, {
        withFileTypes: true,
      });
    } catch {
      throw new BadRequestException('Unable to list this workspace directory');
    }

    const result: WorkspaceFileEntry[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && DEFAULT_IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const entryRelativePath = relativePath
        ? join(relativePath, entry.name)
        : entry.name;

      const entryPath = join(targetPath, entry.name);

      if (entry.isSymbolicLink()) {
        result.push({
          name: entry.name,
          path: entryRelativePath,
          type: 'symlink',
          extension: null,
          size: null,
          modifiedAt: null,
        });

        continue;
      }

      if (!entry.isFile() && !entry.isDirectory()) {
        continue;
      }

      try {
        const entryStats = await stat(entryPath);

        result.push({
          name: entry.name,
          path: entryRelativePath,
          type: entry.isDirectory() ? 'directory' : 'file',
          extension: entry.isFile() ? extname(entry.name) || null : null,
          size: entry.isFile() ? entryStats.size : null,
          modifiedAt: entryStats.mtime.toISOString(),
        });
      } catch {
        // Ignore entries that disappear or become inaccessible
        // while the directory is being listed.
      }
    }

    result.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') {
        return -1;
      }

      if (a.type !== 'directory' && b.type === 'directory') {
        return 1;
      }

      return a.name.localeCompare(b.name);
    });

    return {
      path: relativePath,
      entries: result,
    };
  }

  async readTextFile(
    directoryId: string,
    relativePath: string,
  ): Promise<WorkspaceFileContent> {
    const rootPath = await this.getWorkspaceRoot(directoryId);

    const targetPath = await this.resolveWorkspacePath(rootPath, relativePath);

    let fileStats;

    try {
      fileStats = await stat(targetPath);
    } catch {
      throw new NotFoundException('Workspace file not found');
    }

    if (!fileStats.isFile()) {
      throw new BadRequestException('The requested path is not a file');
    }

    if (fileStats.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        'File exceeds the maximum readable size of 1 MB',
      );
    }

    let buffer: Buffer;

    try {
      buffer = await readFile(targetPath);
    } catch {
      throw new BadRequestException('Unable to read this workspace file');
    }

    // Reject binary content before decoding it as text.
    if (buffer.includes(0)) {
      throw new BadRequestException('Binary files cannot be read as text');
    }

    let content: string;

    try {
      content = new TextDecoder('utf-8', {
        fatal: true,
      }).decode(buffer);
    } catch {
      throw new BadRequestException('File is not valid UTF-8 text');
    }

    return {
      path: relativePath,
      name: relativePath.split(/[\\/]/).pop() ?? relativePath,
      extension: extname(relativePath) || null,
      size: buffer.byteLength,
      modifiedAt: fileStats.mtime.toISOString(),
      content,
    };
  }

  private async getWorkspaceRoot(directoryId: string) {
    const directory = await this.workspaceService.getDirectory(directoryId);

    try {
      const rootPath = await realpath(directory.path);
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

  private async resolveWorkspacePath(rootPath: string, requestedPath: string) {
    if (requestedPath.includes('\0')) {
      throw new BadRequestException('Invalid workspace path');
    }

    if (isAbsolute(requestedPath)) {
      throw new BadRequestException(
        'Only relative workspace paths are allowed',
      );
    }

    const targetPath = resolve(rootPath, requestedPath);
    const relativePath = relative(rootPath, targetPath);

    if (
      relativePath === '..' ||
      relativePath.startsWith(`..${sep}`) ||
      isAbsolute(relativePath)
    ) {
      throw new BadRequestException(
        'Path must remain inside the registered workspace directory',
      );
    }

    let canonicalTargetPath: string;

    try {
      canonicalTargetPath = await realpath(targetPath);
    } catch {
      throw new NotFoundException(
        'Workspace path does not exist or cannot be accessed',
      );
    }

    const canonicalRelativePath = relative(rootPath, canonicalTargetPath);

    if (
      canonicalRelativePath === '..' ||
      canonicalRelativePath.startsWith(`..${sep}`) ||
      isAbsolute(canonicalRelativePath)
    ) {
      throw new BadRequestException(
        'Symbolic links outside the workspace are not allowed',
      );
    }

    return canonicalTargetPath;
  }
}
