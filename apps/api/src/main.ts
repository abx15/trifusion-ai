import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Global prefix with health/ready excluded from versioning
  app.setGlobalPrefix('api', {
    exclude: ['health', 'health/', 'ready', 'ready/'],
  });

  // Global validation pipe with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:3002',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  });

  // Swagger OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('TriFusion AI API')
    .setDescription('AI-powered Business Workspace REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'System health and readiness probes')
    .addTag('Authentication', 'User authentication and session management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 TriFusion API server running on http://localhost:${port}`);
  console.log(`🩺 Liveness probe: http://localhost:${port}/health`);
  console.log(`🩺 Readiness probe: http://localhost:${port}/ready`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
