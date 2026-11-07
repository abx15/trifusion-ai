import { validateEnvironment } from './env.validation';

const validProductionEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pass@db.example.com/app',
  DIRECT_URL: 'postgresql://user:pass@db.example.com/app',
  AUTH_SECRET: 'a-production-secret-that-is-at-least-32-characters-long',
};

describe('validateEnvironment production safeguards', () => {
  it('accepts explicit production database URLs and a strong auth secret', () => {
    expect(() => validateEnvironment(validProductionEnv)).not.toThrow();
  });

  it('rejects a missing production DATABASE_URL instead of using the dev fallback', () => {
    const withoutDatabase = { ...validProductionEnv, DATABASE_URL: undefined };
    expect(() => validateEnvironment(withoutDatabase)).toThrow(
      'DATABASE_URL must be explicitly configured in production.',
    );
  });

  it('rejects a missing DIRECT_URL in production', () => {
    const withoutDirectUrl = { ...validProductionEnv, DIRECT_URL: undefined };
    expect(() => validateEnvironment(withoutDirectUrl)).toThrow(
      'DIRECT_URL must be explicitly configured in production.',
    );
  });

  it('rejects the development auth secret in production', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionEnv,
        AUTH_SECRET: 'dev_insecure_jwt_secret_replace_in_production_32chars',
      }),
    ).toThrow('AUTH_SECRET must be a unique secret with at least 32 characters in production.');
  });

  it('keeps local development defaults available', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'development',
      }),
    ).not.toThrow();
  });
});
