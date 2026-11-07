import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import { DatabaseService } from '../../common/database/database.service.js';
import {
  workspaceDirectories,
  type NewWorkspaceDirectory,
} from '../../common/database/drizzle/schema/index.js';

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly database: DatabaseService) {}

  async create(data: NewWorkspaceDirectory) {
    const [directory] = await this.database.db
      .insert(workspaceDirectories)
      .values(data)
      .returning();

    return directory;
  }

  async findById(id: string) {
    return this.database.db.query.workspaceDirectories.findFirst({
      where: eq(workspaceDirectories.id, id),
    });
  }

  async findByProjectId(projectId: string) {
    return this.database.db.query.workspaceDirectories.findMany({
      where: eq(workspaceDirectories.projectId, projectId),
      orderBy: [desc(workspaceDirectories.updatedAt)],
    });
  }

  async update(
    id: string,
    data: Partial<Pick<NewWorkspaceDirectory, 'name' | 'path'>>,
  ) {
    const [directory] = await this.database.db
      .update(workspaceDirectories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(workspaceDirectories.id, id))
      .returning();

    return directory;
  }

  async delete(id: string) {
    await this.database.db
      .delete(workspaceDirectories)
      .where(eq(workspaceDirectories.id, id));
  }
}
