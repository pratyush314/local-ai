import { Injectable } from '@nestjs/common';
import { and, eq, like, or } from 'drizzle-orm';

import { DatabaseService } from '../../../common/database/database.service.js';
import {
  type NewWorkspaceFileContent,
  workspaceFileContents,
  workspaceFiles,
} from '../../../common/database/drizzle/index.js';
import { WORKSPACE_FILE_INDEX_STATUS } from '@local-ai/constants';

@Injectable()
export class WorkspaceFileContentsRepository {
  constructor(private readonly database: DatabaseService) {}

  async upsert(data: NewWorkspaceFileContent) {
    const [result] = await this.database.db
      .insert(workspaceFileContents)
      .values(data)
      .onConflictDoUpdate({
        target: workspaceFileContents.fileId,
        set: {
          content: data.content,
          tokenCount: data.tokenCount,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result;
  }

  async findByFileId(fileId: string) {
    return this.database.db.query.workspaceFileContents.findFirst({
      where: eq(workspaceFileContents.fileId, fileId),
    });
  }

  async searchIndexedContent(
    workspaceDirectoryId: string,
    terms: string[],
    limit: number,
  ) {
    if (terms.length === 0) {
      return [];
    }

    return this.database.db
      .select({
        fileId: workspaceFileContents.fileId,
        relativePath: workspaceFiles.relativePath,
        name: workspaceFiles.name,
        content: workspaceFileContents.content,
        tokenCount: workspaceFileContents.tokenCount,
      })
      .from(workspaceFileContents)
      .innerJoin(
        workspaceFiles,
        eq(workspaceFileContents.fileId, workspaceFiles.id),
      )
      .where(
        and(
          eq(workspaceFiles.workspaceDirectoryId, workspaceDirectoryId),
          eq(workspaceFiles.indexStatus, WORKSPACE_FILE_INDEX_STATUS.INDEXED),
          or(
            ...terms.map((term) =>
              like(workspaceFileContents.content, `%${term}%`),
            ),
          ),
        ),
      )
      .limit(limit);
  }
}
