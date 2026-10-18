import { Module } from '@nestjs/common';
import * as NestGraphQL from '@nestjs/graphql';
import { registerEnumType } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLResolver } from './graphql.resolver';
import {
  ProjectGraphQLFieldsResolver,
  TaskGraphQLFieldsResolver,
} from './graphql.resolver';
import { GraphQLTimeoutInterceptor } from './graphql-timeout.interceptor';
import {
  ActivityAction,
  ClientStatus,
  EntityType,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { ClientsModule } from '../clients/clients.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { ActivityModule } from '../activity/activity.module';
import { WorkspaceSettingsModule } from '../workspace-settings/workspace-settings.module';
import { PolicyModule } from '../../common/policy/policy.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { Request, Response } from 'express';
import { createGraphQLQueryLimits } from './graphql-query-limits';

registerEnumType(ProjectStatus, { name: 'ProjectStatus' });
registerEnumType(TaskStatus, { name: 'TaskStatus' });
registerEnumType(TaskPriority, { name: 'TaskPriority' });
registerEnumType(ClientStatus, { name: 'ClientStatus' });
registerEnumType(EntityType, { name: 'EntityType' });
registerEnumType(ActivityAction, { name: 'ActivityAction' });

@Module({
  imports: [
    NestGraphQL.GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const isProd = config.get('nodeEnv') === 'production';

        return {
          driver: ApolloDriver,
          autoSchemaFile: true,
          sortSchema: true,
          playground: !isProd,
          includeDebugOutput: !isProd,
          introspection: !isProd,
          validationRules: [createGraphQLQueryLimits({ maxDepth: 5, maxComplexity: 100 })],
          formatError: (formattedError) => {
            if (formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
              return {
                message: 'An unexpected error occurred',
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
              };
            }
            return formattedError;
          },
          context: ({ req, res }: { req: Request; res: Response }) => ({
            req,
            res,
            correlationId: req.headers['x-request-id'] as string,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          }),
        };
      },
      inject: [ConfigService],
    }),
    ClientsModule,
    ProjectsModule,
    TasksModule,
    ActivityModule,
    WorkspaceSettingsModule,
    PolicyModule,
    AuthModule,
    PrismaModule,
  ],
  providers: [
    GraphQLResolver,
    ProjectGraphQLFieldsResolver,
    TaskGraphQLFieldsResolver,
    GraphQLTimeoutInterceptor,
  ],
})
export class GraphQLModule {}
