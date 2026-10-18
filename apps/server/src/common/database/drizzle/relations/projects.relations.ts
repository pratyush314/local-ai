import { relations } from 'drizzle-orm';

import { conversations } from '../schema/conversations.schema.js';
import { projectMemories } from '../schema/project-memories.schema.js';
import { projects } from '../schema/projects.schema.js';

export const projectsRelations = relations(projects, ({ many }) => ({
  conversations: many(conversations),
  memories: many(projectMemories),
}));
