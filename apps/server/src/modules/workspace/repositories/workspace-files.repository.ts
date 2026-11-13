import { Injectable } from '@nestjs/common';
import { and, eq, inArray, notInArray } from 'drizzle-orm';
import { DatabaseService } from '../../../common/database/database.service.js';
import {
  NewWorkspaceFile,
  workspaceFiles,
} from '../../../common/database/drizzle/index.js';
import { WORKSPACE_FILE_INDEX_STATUS } from '@local-ai/constants/workspace';

@Injectable()
export class WorkspaceFilesRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByDirectoryId(workspaceDirectoryId: string) {
    return this.database.db.query.workspaceFiles.findMany({
      where: eq(workspaceFiles.workspaceDirectoryId, workspaceDirectoryId),
    });
  }

  async findPendingByDirectoryId(workspaceDirectoryId: string) {
    return this.database.db.query.workspaceFiles.findMany({
      where: and(
        eq(workspaceFiles.workspaceDirectoryId, workspaceDirectoryId),
        eq(workspaceFiles.indexStatus, WORKSPACE_FILE_INDEX_STATUS.PENDING),
      ),
    });
  }

  async findPendingOrFailedByDirectoryId(workspaceDirectoryId: string) {
    return this.database.db.query.workspaceFiles.findMany({
      where: and(
        eq(workspaceFiles.workspaceDirectoryId, workspaceDirectoryId),
        inArray(workspaceFiles.indexStatus, [
          WORKSPACE_FILE_INDEX_STATUS.PENDING,
          WORKSPACE_FILE_INDEX_STATUS.FAILED,
        ]),
      ),
    });
  }

  async create(data: NewWorkspaceFile) {
    const [file] = await this.database.db
      .insert(workspaceFiles)
      .values(data)
      .returning();

    return file;
  }

  async update(id: string, data: Partial<NewWorkspaceFile>) {
    const [file] = await this.database.db
      .update(workspaceFiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(workspaceFiles.id, id))
      .returning();

    return file;
  }

  async deleteMissingFiles(
    workspaceDirectoryId: string,
    discoveredPaths: string[],
  ) {
    const directoryCondition = eq(
      workspaceFiles.workspaceDirectoryId,
      workspaceDirectoryId,
    );

    if (discoveredPaths.length === 0) {
      await this.database.db.delete(workspaceFiles).where(directoryCondition);

      return;
    }

    await this.database.db
      .delete(workspaceFiles)
      .where(
        and(
          directoryCondition,
          notInArray(workspaceFiles.relativePath, discoveredPaths),
        ),
      );
  }

  async deleteByIds(ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    // Chunk to avoid SQLite's parameter limit.
    for (let index = 0; index < ids.length; index += 500) {
      const chunk = ids.slice(index, index + 500);

      await this.database.db
        .delete(workspaceFiles)
        .where(inArray(workspaceFiles.id, chunk));
    }
  }
}
