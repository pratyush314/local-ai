import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService } from '../../../common/database/database.service.js';
import {
  type NewWorkspaceFileContent,
  workspaceFileContents,
} from '../../../common/database/drizzle/index.js';

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
}
