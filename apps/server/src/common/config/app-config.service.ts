import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvConfig } from './types/app-config.type';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.configService.get(key, {
      infer: true,
    });
  }

  getOrThrow<K extends keyof EnvConfig>(key: K): NonNullable<EnvConfig[K]> {
    return this.configService.getOrThrow(key, {
      infer: true,
    });
  }

  get isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  get isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  get isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }
}
