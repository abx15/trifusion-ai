import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { configuration } from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { PrismaModule } from './common/prisma/prisma.module';
import { PolicyModule } from './common/policy/policy.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { CookieParserMiddleware } from './common/middleware/cookie-parser.middleware';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { PlatformModule } from './modules/platform/platform.module';
import { AuditModule } from './modules/audit/audit.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ActivityModule } from './modules/activity/activity.module';
import { WorkspaceSettingsModule } from './modules/workspace-settings/workspace-settings.module';
import { GraphQLModule } from './modules/graphql/graphql.module';
import { GraphQLThrottlerGuard } from './modules/graphql/graphql-throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    PolicyModule,
    AuditModule,
    HealthModule,
    AuthModule,
    WorkspacesModule,
    PlatformModule,
    ClientsModule,
    ProjectsModule,
    TasksModule,
    ActivityModule,
    WorkspaceSettingsModule,
    GraphQLModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: GraphQLThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, CookieParserMiddleware)
      .forRoutes('*');
  }
}
