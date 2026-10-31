import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { configureIsolatedTestDatabase } from './src/test-database';

async function main() {
  configureIsolatedTestDatabase();
  console.log('DB configured');
  
  const { TestAppModule } = await import('./src/test-app.module');
  console.log('Module imported');
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();
  console.log('Module compiled');
  
  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/', 'ready', 'ready/'] });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  console.log('App created');
  
  await app.init();
  console.log('App initialized');
  
  await app.close();
  console.log('App closed');
}

main().catch(e => {
  console.log('Error:', e.message);
  console.log('Stack:', e.stack);
  process.exit(1);
});
