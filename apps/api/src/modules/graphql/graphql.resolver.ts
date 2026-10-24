import {
  Args,
  Context,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { UseGuards, UseInterceptors, UnauthorizedException } from '@nestjs/common';
import { ProjectStatus, TaskPriority, TaskStatus } from '@prisma/client';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { ActivityService } from '../activity/activity.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { Project, ProjectConnection } from '../projects/entities/project.entity';
import { Task, TaskAssignee, TaskConnection } from '../tasks/entities/task.entity';
import { ActivityEventConnection } from '../activity/entities/activity-event.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GraphQLTimeoutInterceptor } from './graphql-timeout.interceptor';
import { WorkspaceOverview } from './entities/workspace-overview.entity';
import { WorkspaceOverviewFilterInput } from './dto/workspace-overview-filter.input';
import { WorkspaceAnalytics } from './entities/workspace-analytics.entity';

interface GraphQLContext {
  req: {
    user?: { id: string; email: string };
  };
}

@Resolver()
@UseGuards(JwtAuthGuard)
@UseInterceptors(GraphQLTimeoutInterceptor)
export class GraphQLResolver {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly activityService: ActivityService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  private getCurrentUser(context: GraphQLContext): { id: string; email: string } {
    const user = context.req.user;
    if (!user?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }

  @Query(() => ProjectConnection)
  async projects(
    @Context() context: GraphQLContext,
    @Args('workspaceId') workspaceId: string,
    @Args('limit', { type: () => Int }) limit: number,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('status', { type: () => ProjectStatus, nullable: true }) status?: ProjectStatus,
    @Args('clientId', { type: () => String, nullable: true }) clientId?: string,
  ) {
    const user = this.getCurrentUser(context);
    return this.projectsService.listProjects(workspaceId, user.id, {
      cursor,
      limit,
      status,
      clientId,
    });
  }

  @Query(() => TaskConnection)
  async tasks(
    @Context() context: GraphQLContext,
    @Args('workspaceId') workspaceId: string,
    @Args('limit', { type: () => Int }) limit: number,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
    @Args('status', { type: () => TaskStatus, nullable: true }) status?: TaskStatus,
    @Args('priority', { type: () => TaskPriority, nullable: true }) priority?: TaskPriority,
    @Args('projectId', { type: () => String, nullable: true }) projectId?: string,
    @Args('projectStatus', { type: () => ProjectStatus, nullable: true }) projectStatus?: ProjectStatus,
    @Args('assigneeId', { type: () => String, nullable: true }) assigneeId?: string,
    @Args('includeArchived', { type: () => Boolean, nullable: true }) includeArchived?: boolean,
  ) {
    const user = this.getCurrentUser(context);
    return this.tasksService.listTasks(workspaceId, user.id, {
      cursor,
      limit,
      status,
      priority,
      projectId,
      projectStatus,
      assigneeId,
      includeArchived,
    });
  }

  @Query(() => ActivityEventConnection)
  async recentActivity(
    @Context() context: GraphQLContext,
    @Args('workspaceId') workspaceId: string,
    @Args('limit', { type: () => Int }) limit: number,
    @Args('cursor', { type: () => String, nullable: true }) cursor?: string,
  ) {
    const user = this.getCurrentUser(context);
    return this.activityService.listActivity(workspaceId, user.id, { cursor, limit });
  }

  @Query(() => WorkspaceOverview)
  async workspaceOverview(
    @Context() context: GraphQLContext,
    @Args('workspaceId') workspaceId: string,
    @Args('filters', { type: () => WorkspaceOverviewFilterInput, nullable: true })
    filters?: WorkspaceOverviewFilterInput,
  ) {
    const user = this.getCurrentUser(context);
    return this.projectsService.getWorkspaceOverview(workspaceId, user.id, filters);
  }

  @Query(() => WorkspaceAnalytics)
  async workspaceAnalytics(
    @Context() context: GraphQLContext,
    @Args('workspaceId') workspaceId: string,
    @Args('projectId', { nullable: true }) projectId?: string,
    @Args('projectStatus', { type: () => ProjectStatus, nullable: true }) projectStatus?: ProjectStatus,
    @Args('assigneeId', { nullable: true }) assigneeId?: string,
    @Args('taskStatus', { type: () => TaskStatus, nullable: true }) taskStatus?: TaskStatus,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
  ) {
    const user = this.getCurrentUser(context);
    return this.analyticsService.getWorkspaceOverview(workspaceId, user.id, {
      projectId,
      projectStatus,
      assigneeId,
      taskStatus,
      startDate,
      endDate,
    });
  }

}

@Resolver(() => Project)
@UseGuards(JwtAuthGuard)
export class ProjectGraphQLFieldsResolver {
  @ResolveField(() => Int)
  taskCount(@Parent() project: { _count?: { tasks: number } }): number {
    return project._count?.tasks ?? 0;
  }
}

@Resolver(() => Task)
@UseGuards(JwtAuthGuard)
export class TaskGraphQLFieldsResolver {
  @ResolveField(() => TaskAssignee, { nullable: true })
  assignee(
    @Parent()
    task: {
      assignee?: {
        userId: string;
        user: {
          id: string;
          email: string;
          profile: { firstName: string; lastName: string } | null;
        };
      } | null;
    },
  ): TaskAssignee | null {
    const member = task.assignee;
    if (!member) return null;

    return {
      id: member.user.id,
      email: member.user.email,
      firstName: member.user.profile?.firstName ?? null,
      lastName: member.user.profile?.lastName ?? null,
    };
  }
}
