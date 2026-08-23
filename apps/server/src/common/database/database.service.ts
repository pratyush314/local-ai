import { Inject, Injectable } from '@nestjs/common';

import { DATABASE_CLIENT } from './database.constants';
import type { DrizzleDatabase } from './drizzle/client';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(DATABASE_CLIENT)
    public readonly db: DrizzleDatabase,
  ) {}
}
