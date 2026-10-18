export function configureIsolatedTestDatabase(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Integration tests are disabled in production');
  }

  const pooledTestUrl = process.env.DATABASE_URL_TEST;
  const directTestUrl = process.env.DIRECT_URL_TEST;
  if (!pooledTestUrl || !directTestUrl) {
    throw new Error(
      'Integration tests require DATABASE_URL_TEST and DIRECT_URL_TEST for a disposable non-production database branch',
    );
  }
  if (
    pooledTestUrl === process.env.DATABASE_URL ||
    directTestUrl === process.env.DIRECT_URL
  ) {
    throw new Error('Integration test database URLs must differ from runtime database URLs');
  }

  process.env.DATABASE_URL = pooledTestUrl;
  process.env.DIRECT_URL = directTestUrl;
}
