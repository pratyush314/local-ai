import { Injectable, NotFoundException } from '@nestjs/common';

import type { NewProject } from '../../common/database/drizzle/schema/index.js';
import { ProjectsRepository } from './projects.repository.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async createProject(input: Pick<NewProject, 'name' | 'rootPath'>) {
    const name = input.name.trim();

    if (!name) {
      throw new Error('Project name cannot be empty');
    }

    const rootPath = input.rootPath?.trim() || null;

    return this.projectsRepository.create({
      id: crypto.randomUUID(),
      name,
      rootPath,
    });
  }

  async getProject(id: string) {
    const project = await this.projectsRepository.findById(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async getProjects() {
    return this.projectsRepository.findAll();
  }

  async updateProject(
    id: string,
    input: Partial<Pick<NewProject, 'name' | 'rootPath'>>,
  ) {
    await this.getProject(id);

    const update: Partial<Pick<NewProject, 'name' | 'rootPath'>> = {};

    if (input.name !== undefined) {
      const name = input.name.trim();

      if (!name) {
        throw new Error('Project name cannot be empty');
      }

      update.name = name;
    }

    if (input.rootPath) {
      update.rootPath = input.rootPath.trim() || null;
    }

    const project = await this.projectsRepository.update(id, update);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async deleteProject(id: string) {
    await this.getProject(id);
    await this.projectsRepository.delete(id);
  }
}
