import { Logger } from '@nestjs/common';
import { z } from 'zod';

export const environmentSchema = z.enum(['development', 'production', 'test']);

const positiveIntFromEnvSchema = z.coerce.number().int().positive();

export const envValidationSchema = z.object({
  APP_VERSION: z.string().min(1).default('v1'),

  NODE_ENV: environmentSchema.default('development'),

  PORT: z.coerce.number().int().min(1).max(65535).default(8000),

  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .default('./data/local-ai.db'),

  DATABASE_PATH: z.string().min(1, 'DATABASE_PATH is required'),

  LLAMA_MODEL_PATH: z.string().min(1, 'LLAMA_MODEL_PATH is required'),

  LLAMA_CPP_PATH: z.string().min(1, 'LLAMA_CPP_PATH is required'),

  LLAMA_CPP_BASE_URL: z.string().url(),

  LLAMA_SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(8080),

  STORAGE_PATH: z.string().min(1, 'STORAGE_PATH is required'),

  MAX_FILE_SIZE_MB: positiveIntFromEnvSchema.default(100),

  LLAMA_CONTEXT_SIZE: positiveIntFromEnvSchema.default(8192),

  CHAT_MAX_OUTPUT_TOKENS: positiveIntFromEnvSchema.default(1024),

  CHAT_CONTEXT_SAFETY_TOKENS: z.coerce.number().int().min(0).default(512),
});

export type EnvConfig = z.infer<typeof envValidationSchema>;

export function validateEnv(config: Record<string, unknown>) {
  const logger = new Logger('ConfigValidation');

  const result = envValidationSchema.safeParse(config);

  if (!result.success) {
    logger.error('Invalid environment configuration:');

    for (const issue of result.error.issues) {
      logger.error(`- [${issue.path.join('.')}] ${issue.message}`);
    }

    throw new Error('Environment configuration validation failed');
  }

  logger.log('Environment variables validated successfully');

  return result.data;
}
