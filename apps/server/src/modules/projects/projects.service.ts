import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from '@local-ai/contracts/project';

import { ProjectsRepository } from './projects.repository.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async createProject(input: CreateProjectInput) {
    const name = input.name.trim();

    if (!name) {
      throw new BadRequestException('Project name cannot be empty');
    }

    return this.projectsRepository.create({
      id: crypto.randomUUID(),
      name,
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

  async updateProject(id: string, input: UpdateProjectInput) {
    await this.getProject(id);

    const update: {
      name?: string;
    } = {};

    if (input.name !== undefined) {
      const name = input.name.trim();

      if (!name) {
        throw new BadRequestException('Project name cannot be empty');
      }

      update.name = name;
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
