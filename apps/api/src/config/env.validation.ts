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

export type ValidatedEnv = z.infer<typeof envSchema>;

export function validateEnvironment(config: Record<string, unknown>): ValidatedEnv {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((err: z.ZodIssue) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    console.error(`\n❌ Environment validation failed:\n${errorMessages}\n`);
    throw new Error(`Environment validation failed. Please check your .env file.\n${errorMessages}`);
  }

  return result.data;
}
