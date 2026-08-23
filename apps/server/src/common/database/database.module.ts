import { Global, Module } from '@nestjs/common';

import { AppConfigModule } from '@/common/config/app-config.module';
import { AppConfigService } from '@/common/config/app-config.service';

import { DATABASE_CLIENT } from './database.constants';
import { DatabaseService } from './database.service';
import { createDatabaseClient } from './drizzle/client';

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
