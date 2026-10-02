import { Global, Module } from '@nestjs/common';

import { AppConfigModule } from '../config/app-config.module.js';
import { AppConfigService } from '../config/app-config.service.js';

import { DATABASE_CLIENT } from './database.constants.js';
import { DatabaseService } from './database.service.js';
import { createDatabaseClient } from './drizzle/client.js';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: DATABASE_CLIENT,
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) =>
        createDatabaseClient(configService),
    },
    DatabaseService,
  ],
  exports: [DatabaseService, DATABASE_CLIENT],
})
export class DatabaseModule {}
