import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { AppConfigService } from '@/common/config/app-config.service';

import * as schema from './schema';

export function createDatabaseClient(configService: AppConfigService) {
  const databaseUrl = configService.getOrThrow('DATABASE_URL');

  const sqlite = new BetterSqlite3(databaseUrl);

  return drizzle(sqlite, {
    schema,
  });
}

export type DrizzleDatabase = ReturnType<typeof createDatabaseClient>;
