import { z } from 'zod';

const DEVELOPMENT_AUTH_SECRET =
  'dev_insecure_jwt_secret_replace_in_production_32chars';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val: string) => parseInt(val, 10)).default('3001'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('postgresql://postgres:postgres@localhost:5432/trifusion_dev'),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters').default(DEVELOPMENT_AUTH_SECRET),
  AUTH_EXPIRES_IN: z.string().default('15m'),
  AUTH_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3002'),
  REDIS_URL: z.string().optional(),
  AI_SERVICE_URL: z.string().url().optional(),
  AI_SERVICE_SHARED_SECRET: z.string().optional(),
});

const validatedEnvSchema = envSchema.extend({
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a PostgreSQL connection URL')
    .default('postgresql://postgres:postgres@localhost:5432/trifusion_dev'),
  DIRECT_URL: z
    .string()
    .url('DIRECT_URL must be a PostgreSQL connection URL')
    .optional(),
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

  const env = result.data;
  if (env.NODE_ENV === 'production') {
    if (!config.DATABASE_URL) {
      throw new Error('DATABASE_URL must be explicitly configured in production.');
    }
    if (!config.DIRECT_URL || !env.DIRECT_URL) {
      throw new Error('DIRECT_URL must be explicitly configured in production.');
    }
    if (!env.AI_SERVICE_URL) {
      throw new Error('AI_SERVICE_URL must be explicitly configured in production.');
    }
    if (!env.AI_SERVICE_SHARED_SECRET || env.AI_SERVICE_SHARED_SECRET.length < 32) {
      throw new Error('AI_SERVICE_SHARED_SECRET must be configured with at least 32 characters in production.');
    }
    if (env.AUTH_SECRET === DEVELOPMENT_AUTH_SECRET || env.AUTH_SECRET.length < 32) {
      throw new Error('AUTH_SECRET must be a unique secret with at least 32 characters in production.');
    }
  }

  if (env.DATABASE_URL_TEST && env.DATABASE_URL_TEST === env.DATABASE_URL && env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL_TEST must point to a separate non-production test branch');
  }
  if (env.DIRECT_URL_TEST && env.DIRECT_URL_TEST === env.DIRECT_URL && env.NODE_ENV === 'production') {
    throw new Error('DIRECT_URL_TEST must point to a separate non-production test branch');
  }
  if (env.DATABASE_URL_SEED === env.DATABASE_URL) {
    throw new Error('DATABASE_URL_SEED must point to a separate non-production development database');
  }
  if (env.ALLOW_DEV_SEED === 'true' && env.NODE_ENV !== 'development') {
    throw new Error('ALLOW_DEV_SEED=true is permitted only when NODE_ENV=development');
  }

  return env;
}
