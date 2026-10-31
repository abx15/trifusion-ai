import { Module, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Bull from 'bull';
import { AuditAction } from '@prisma/client';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuditLogService } from '../audit/audit.service';
import { AiService } from '../ai/ai.service';
import { AiModule } from '../ai/ai.module';

export const AI_QUEUE = 'AI_QUEUE';

@Module({
  imports: [ConfigModule, PrismaModule, AuditModule, AiModule],
  controllers: [JobsController],
  providers: [
    JobsService,
    {
      provide: AI_QUEUE,
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL') || 'redis://localhost:6379';
        return new Bull('ai-jobs', redisUrl, {
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'AI_WORKER',
      useFactory: async (
        queue: Bull.Queue,
        aiService: AiService,
        jobsService: JobsService,
        auditService: AuditLogService,
      ) => {
        const logger = new Logger('AIWorker');

        queue.process(
          'ai-processor',
          5,
          async (job: Bull.Job<Record<string, unknown>>) => {
            const jobIdStr = String(job.id);
            const { type, workspace_id, user_id, data, request_id } = job.data as {
              type: string;
              workspace_id: string;
              user_id: string;
              data: Record<string, unknown>;
              request_id: string;
            };

            try {
              await jobsService.updateStatus(jobIdStr, 'processing', undefined, 1);

              let result;
              switch (type) {
                case 'project_summary':
                  result = await aiService.generateProjectSummary({
                    workspace_id,
                    user_id,
                    role: (data.role as string) || 'MEMBER',
                    project_id: data.project_id as string,
                    tasks: (data.tasks as Array<{ id: string; title: string; status: string; priority: string }>) || [],
                    activity: (data.activity as Array<{ id: string; action: string; timestamp: string }>) || [],
                    request_id,
                  });
                  break;
                case 'weekly_report':
                  result = await aiService.generateWeeklyReport({
                    workspace_id,
                    user_id,
                    role: (data.role as string) || 'MEMBER',
                    analytics: (data.analytics as Record<string, unknown>) || {},
                    reporting_period: (data.reporting_period as { start: string; end: string }) || {
                      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                      end: new Date().toISOString(),
                    },
                    request_id,
                  });
                  break;
                case 'task_suggestions':
                  result = await aiService.getTaskSuggestions({
                    workspace_id,
                    user_id,
                    role: (data.role as string) || 'MEMBER',
                    task_id: data.task_id as string,
                    task: data.task as { id: string; title: string; status: string; priority: string },
                    project: data.project as { id: string; name: string; status: string },
                    request_id,
                  });
                  break;
                case 'assistant':
                  result = await aiService.askAssistant({
                    workspace_id,
                    user_id,
                    role: (data.role as string) || 'MEMBER',
                    question: data.question as string,
                    retrieved_context: (data.retrieved_context as Array<{ id: string; type: string; title: string }>) || [],
                    request_id,
                  });
                  break;
                default:
                  throw new Error(`Unknown AI job type: ${type}`);
              }

              await jobsService.updateStatus(jobIdStr, 'completed');
              await auditService.log({
                actorId: user_id,
                action: AuditAction.AI_USAGE,
                targetType: 'AIJob',
                targetId: jobIdStr,
                workspaceId: workspace_id,
                requestId: request_id,
                metadata: { type, jobId: jobIdStr },
              });

              return result;
            } catch (error) {
              await jobsService.updateStatus(jobIdStr, 'failed', (error as Error).message);
              logger.error(`AI job ${job.id} failed:`, error);
              throw error;
            }
          },
        );

        queue.on('completed', (job) => {
          logger.log(`AI job ${String(job.id)} completed`);
        });

        queue.on('failed', (job, err) => {
          logger.error(`AI job ${String(job?.id)} failed:`, err);
        });

        return queue;
      },
      inject: [AI_QUEUE, AiService, JobsService, AuditLogService],
    },
  ],
  exports: [JobsService, AI_QUEUE],
})
export class JobsModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsModule.name);

  constructor(
    @Inject(AI_QUEUE) private readonly queue: Bull.Queue,
  ) {}

  async onModuleInit() {
    await this.queue.isReady();
    this.logger.log('AI job queue ready');
  }

  async onModuleDestroy() {
    await this.queue.close();
    this.logger.log('AI job queue closed');
  }
}
