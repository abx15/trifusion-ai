export function configureIsolatedTestDatabase(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Integration tests are disabled in production');
  }

  const pooledTestUrl = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
  const directTestUrl = process.env.DIRECT_URL_TEST ?? process.env.DIRECT_URL;
  if (!pooledTestUrl || !directTestUrl) {
    throw new Error(
      'Integration tests require DATABASE_URL_TEST and DIRECT_URL_TEST (or DATABASE_URL and DIRECT_URL as fallback)',
    );
  }

  process.env.DATABASE_URL = pooledTestUrl;
  process.env.DIRECT_URL = directTestUrl;
}
