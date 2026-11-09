import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, normalize, resolve } from 'node:path';

import { ProjectsService } from '../../projects/projects.service.js';

import { WorkspaceRepository } from '../workspace.repository.js';

import type {
  CreateWorkspaceDirectoryInput,
  UpdateWorkspaceDirectoryInput,
} from '@local-ai/contracts/workspace';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly projectsService: ProjectsService,
  ) {}

  async registerDirectory(
    projectId: string,
    input: CreateWorkspaceDirectoryInput,
  ) {
    await this.projectsService.getProject(projectId);

    const directoryPath = await this.validateDirectoryPath(input.path);
    const name = input.name.trim();

    if (!name) {
      throw new BadRequestException('Directory name cannot be empty');
    }

    await this.ensurePathIsNotRegistered(projectId, directoryPath);

    return this.workspaceRepository.create({
      id: crypto.randomUUID(),
      projectId,
      name,
      path: directoryPath,
    });
  }

  async getDirectory(id: string) {
    const directory = await this.workspaceRepository.findById(id);

    if (!directory) {
      throw new NotFoundException('Workspace directory not found');
    }

    return directory;
  }

  async getDirectories(projectId: string) {
    await this.projectsService.getProject(projectId);

    return this.workspaceRepository.findByProjectId(projectId);
  }

  async updateDirectory(id: string, input: UpdateWorkspaceDirectoryInput) {
    const directory = await this.getDirectory(id);

    const update: {
      name?: string;
      path?: string;
    } = {};

    if (input.name !== undefined) {
      const name = input.name.trim();

      if (!name) {
        throw new BadRequestException('Directory name cannot be empty');
      }

      update.name = name;
    }

    if (input.path !== undefined) {
      const directoryPath = await this.validateDirectoryPath(input.path);

      await this.ensurePathIsNotRegistered(
        directory.projectId,
        directoryPath,
        directory.id,
      );

      update.path = directoryPath;
    }

    const updatedDirectory = await this.workspaceRepository.update(id, update);

    if (!updatedDirectory) {
      throw new NotFoundException('Workspace directory not found');
    }

    return updatedDirectory;
  }

  async removeDirectory(id: string) {
    await this.getDirectory(id);

    // Only remove the registration. Never delete the actual files.
    await this.workspaceRepository.delete(id);
  }

  async checkDirectoryAvailability(id: string) {
    const directory = await this.getDirectory(id);

    try {
      const directoryStats = await stat(directory.path);

      return {
        available: directoryStats.isDirectory(),
      };
    } catch {
      return {
        available: false,
      };
    }
  }

  private async validateDirectoryPath(inputPath: string): Promise<string> {
    const trimmedPath = inputPath.trim();

    if (!trimmedPath) {
      throw new BadRequestException('Directory path cannot be empty');
    }

    if (!isAbsolute(trimmedPath)) {
      throw new BadRequestException(
        'Workspace directory path must be absolute',
      );
    }

    const resolvedPath = normalize(resolve(trimmedPath));

    try {
      const directoryPath = await realpath(resolvedPath);
      const directoryStats = await stat(directoryPath);

      if (!directoryStats.isDirectory()) {
        throw new BadRequestException(
          'Workspace path must point to a directory',
        );
      }

      return directoryPath;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Workspace directory does not exist or cannot be accessed',
      );
    }
  }

  private async ensurePathIsNotRegistered(
    projectId: string,
    directoryPath: string,
    excludedDirectoryId?: string,
  ) {
    const directories =
      await this.workspaceRepository.findByProjectId(projectId);

    const normalizedPath = this.getPathIdentity(directoryPath);

    const duplicate = directories.find(
      (directory) =>
        directory.id !== excludedDirectoryId &&
        this.getPathIdentity(directory.path) === normalizedPath,
    );

    if (duplicate) {
      throw new BadRequestException(
        'This directory is already registered with the project',
      );
    }
  }

  private getPathIdentity(directoryPath: string) {
    const normalizedPath = normalize(resolve(directoryPath));

    // Windows paths are case-insensitive.
    return process.platform === 'win32'
      ? normalizedPath.toLowerCase()
      : normalizedPath;
  }
}
