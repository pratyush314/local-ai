import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import { DatabaseService } from '../../common/database/database.service.js';
import {
  projectMemories,
  type NewProjectMemory,
} from '../../common/database/drizzle/schema/index.js';
import { ProjectMemoryStatus } from '@local-ai/constants';

@Injectable()
export class MemoryRepository {
  constructor(private readonly database: DatabaseService) {}

  async create(data: NewProjectMemory) {
    const [memory] = await this.database.db
      .insert(projectMemories)
      .values(data)
      .returning();

    return memory;
  }

  async findById(id: string) {
    return this.database.db.query.projectMemories.findFirst({
      where: eq(projectMemories.id, id),
    });
  }

  async findActiveByProject(projectId: string) {
    return this.database.db.query.projectMemories.findMany({
      where: and(
        eq(projectMemories.projectId, projectId),
        eq(projectMemories.status, 'active'),
      ),
      orderBy: [desc(projectMemories.updatedAt)],
    });
  }

  async updateStatus(id: string, status: ProjectMemoryStatus) {
    const [memory] = await this.database.db
      .update(projectMemories)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(projectMemories.id, id))
      .returning();

    return memory;
  }
}
