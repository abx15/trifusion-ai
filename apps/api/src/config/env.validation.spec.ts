import { validateEnvironment } from './env.validation';

const validProductionEnv = {
  NODE_ENV: 'production',
  WEB_URL: 'https://trifusion-web.vercel.app',
  SENDGRID_API_KEY: 'SG.production-sendgrid-key',
  SENDGRID_FROM_EMAIL: 'no-reply@trifusion.ai',
  DATABASE_URL: 'postgresql://user:pass@db.example.com/app',
  DIRECT_URL: 'postgresql://user:pass@db.example.com/app',
  AUTH_SECRET: 'a-production-secret-that-is-at-least-32-characters-long',
  AI_SERVICE_URL: 'https://trifusion-ai-django.example.com',
  AI_SERVICE_SHARED_SECRET: 'django-shared-secret-at-least-32-characters',
};

describe('validateEnvironment production safeguards', () => {
  it('accepts explicit production database URLs and a strong auth secret', () => {
    expect(() => validateEnvironment(validProductionEnv)).not.toThrow();
  });

  it('rejects a missing production customer app URL', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionEnv,
        WEB_URL: undefined,
      }),
    ).toThrow('WEB_URL must be explicitly set to the production customer app URL.');
  });

  it('rejects production without a working email transport and verified sender', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionEnv,
        SENDGRID_API_KEY: undefined,
        SENDGRID_FROM_EMAIL: undefined,
      }),
    ).toThrow('Production email delivery requires SMTP_HOST/SMTP_USER/SMTP_PASSWORD');
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

  it('rejects missing Django AI service configuration in production', () => {
    expect(() =>
      validateEnvironment({
        ...validProductionEnv,
        AI_SERVICE_URL: undefined,
      }),
    ).toThrow('AI_SERVICE_URL must be explicitly configured in production.');

    expect(() =>
      validateEnvironment({
        ...validProductionEnv,
        AI_SERVICE_SHARED_SECRET: undefined,
      }),
    ).toThrow(
      'AI_SERVICE_SHARED_SECRET must be configured with at least 32 characters in production.',
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
