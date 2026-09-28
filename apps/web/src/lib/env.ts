import { z } from 'zod';

const envSchema = z.object({
	NEXT_PUBLIC_API_URL: z.url().min(1, 'API URL is required'),
	NEXT_PUBLIC_API_VERSION: z.string().default('v1'),
});

export const env = envSchema.parse({
	NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
	NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION,
});
