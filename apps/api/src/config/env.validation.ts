import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val: string) => parseInt(val, 10)).default('3001'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('postgresql://postgres:postgres@localhost:5432/trifusion_dev'),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters').default('dev_insecure_jwt_secret_replace_in_production_32chars'),
  AUTH_EXPIRES_IN: z.string().default('15m'),
  AUTH_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3002'),
  REDIS_URL: z.string().optional(),
});

const validatedEnvSchema = envSchema.extend({
  DATABASE_URL: z.string().url('DATABASE_URL must be a PostgreSQL connection URL'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a PostgreSQL connection URL'),
  DATABASE_URL_TEST: z.string().url().optional(),
  DIRECT_URL_TEST: z.string().url().optional(),
  DATABASE_URL_SEED: z.string().url().optional(),
  ALLOW_DEV_SEED: z.enum(['true', 'false']).default('false'),
});

export type ValidatedEnv = z.infer<typeof validatedEnvSchema>;

export function validateEnvironment(config: Record<string, unknown>): ValidatedEnv {
  const result = validatedEnvSchema.safeParse(config);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((err: z.ZodIssue) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    console.error(`\n❌ Environment validation failed:\n${errorMessages}\n`);
    throw new Error(`Environment validation failed. Please check your .env file.\n${errorMessages}`);
  }

  if (result.data.DATABASE_URL_TEST === result.data.DATABASE_URL) {
    throw new Error('DATABASE_URL_TEST must point to a separate non-production test branch');
  }
  if (result.data.DIRECT_URL_TEST === result.data.DIRECT_URL) {
    throw new Error('DIRECT_URL_TEST must point to a separate non-production test branch');
  }
  if (result.data.DATABASE_URL_SEED === result.data.DATABASE_URL) {
    throw new Error('DATABASE_URL_SEED must point to a separate non-production development database');
  }
  if (result.data.ALLOW_DEV_SEED === 'true' && result.data.NODE_ENV !== 'development') {
    throw new Error('ALLOW_DEV_SEED=true is permitted only when NODE_ENV=development');
  }

  return result.data;
}
