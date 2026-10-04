import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigService } from './app-config.service.js';
import { validateEnv } from './env-validation.config.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
  ],

  providers: [AppConfigService],

  exports: [AppConfigService, ConfigModule],
})
export class AppConfigModule {}
