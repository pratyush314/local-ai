import type { Config } from 'drizzle-kit';

export default {
  schema: './src/common/database/drizzle/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? './data/local-ai.db',
  },
} satisfies Config;
