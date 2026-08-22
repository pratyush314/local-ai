import { z } from 'zod';

import { envValidationSchema } from '../env-validation.config';

export type EnvConfig = z.infer<typeof envValidationSchema>;

export type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

export type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

export type EnvStringKey = StringKeys<EnvConfig>;

export type EnvNumberKey = NumberKeys<EnvConfig>;
