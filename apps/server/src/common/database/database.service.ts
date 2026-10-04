import { Inject, Injectable } from '@nestjs/common';

import { DATABASE_CLIENT } from './database.constants.js';
import type { DrizzleDatabase } from './drizzle/client.js';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(DATABASE_CLIENT)
    public readonly db: DrizzleDatabase,
  ) {}
}
