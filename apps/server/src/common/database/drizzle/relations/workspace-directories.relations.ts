import { relations } from 'drizzle-orm';
import { workspaceDirectories } from '../schema/workspace-directories.schema.js';
import { projects } from '../schema/projects.schema.js';

export const workspaceDirectoriesRelations = relations(
  workspaceDirectories,
  ({ one }) => ({
    project: one(projects, {
      fields: [workspaceDirectories.projectId],
      references: [projects.id],
    }),
  }),
);
