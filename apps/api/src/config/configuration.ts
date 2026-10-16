export interface AppConfig {
  nodeEnv: string;
  port: number;
  webUrl: string;
  databaseUrl: string;
  redisUrl?: string;
  auth: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origins: string[];
  };
}

export const configuration = (): AppConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = parseInt(process.env.PORT || '3001', 10);
  const webUrl = process.env.WEB_URL || 'http://localhost:3000';
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/trifusion_dev';
  const authSecret = process.env.AUTH_SECRET || 'dev_insecure_jwt_secret_replace_in_production_32chars';
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3002'];

  if (nodeEnv === 'production' && (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32)) {
    throw new Error('AUTH_SECRET must be at least 32 characters in production');
  }

  return {
    nodeEnv,
    port,
    webUrl,
    databaseUrl,
    redisUrl: process.env.REDIS_URL,
    auth: {
      secret: authSecret,
      expiresIn: process.env.AUTH_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.AUTH_REFRESH_EXPIRES_IN || '7d',
    },
    cors: {
      origins: corsOrigins,
    },
  };
};

