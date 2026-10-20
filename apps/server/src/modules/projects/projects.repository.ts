import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import { DatabaseService } from '../../common/database/database.service.js';
import {
  projects,
  type NewProject,
} from '../../common/database/drizzle/schema/index.js';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly database: DatabaseService) {}

  async create(data: NewProject) {
    const [project] = await this.database.db
      .insert(projects)
      .values(data)
      .returning();

    return project;
  }

  async findById(id: string) {
    return this.database.db.query.projects.findFirst({
      where: eq(projects.id, id),
    });
  }

  async findAll() {
    return this.database.db.query.projects.findMany({
      orderBy: [desc(projects.updatedAt)],
    });
  }

  async update(
    id: string,
    data: Partial<Pick<NewProject, 'name' | 'rootPath'>>,
  ) {
    const [project] = await this.database.db
      .update(projects)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    return project;
  }

  async delete(id: string) {
    await this.database.db.delete(projects).where(eq(projects.id, id));
  }
}
