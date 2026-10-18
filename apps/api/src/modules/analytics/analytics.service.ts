import { BadRequestException, Injectable } from '@nestjs/common';
import {
  PlatformStaffRoleType,
  Prisma,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { PolicyService } from '../../common/policy/policy.service';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AnalyticsDateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsFilters {
  projectId?: string;
  projectStatus?: ProjectStatus;
  assigneeId?: string;
  taskStatus?: TaskStatus;
  startDate?: string;
  endDate?: string;
}

function parseDate(value?: string, fieldName = 'date') {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid ISO-8601 date`);
  }

  return date;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: PolicyService,
  ) {}

  private normalizeDateRange(filters: AnalyticsFilters): AnalyticsDateRange {
    const start = parseDate(filters.startDate, 'startDate');
    const end = parseDate(filters.endDate, 'endDate');

    if (start && end && start.getTime() > end.getTime()) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    const effectiveStart = start ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const effectiveEnd = end ?? new Date();
    const diffDays = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 365) {
      throw new BadRequestException('Analytics date range may not exceed 365 days');
    }

    return { start: effectiveStart, end: effectiveEnd };
  }

  private buildProjectWhere(workspaceId: string, filters: AnalyticsFilters = {}): Prisma.ProjectWhereInput {
    return {
      workspaceId,
      deletedAt: null,
      ...(filters.projectId ? { id: filters.projectId } : {}),
      ...(filters.projectStatus ? { status: filters.projectStatus } : {}),
    };
  }

  private buildTaskWhere(
    workspaceId: string,
    range: AnalyticsDateRange,
    filters: AnalyticsFilters = {},
  ): Prisma.TaskWhereInput {
    return {
      workspaceId,
      deletedAt: null,
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      ...(filters.taskStatus ? { status: filters.taskStatus } : {}),
      ...(filters.projectStatus ? { project: { is: { status: filters.projectStatus } } } : {}),
      createdAt: { gte: range.start, lte: range.end },
    };
  }

  async getWorkspaceOverview(workspaceId: string, actorId: string, filters: AnalyticsFilters = {}) {
    const context = await this.policyService.getWorkspaceContext(actorId, workspaceId);
    const range = this.normalizeDateRange(filters);
    const projectWhere = this.buildProjectWhere(workspaceId, filters);
    const taskWhere = this.buildTaskWhere(workspaceId, range, filters);

    const [projectGroups, taskGroups, activeProjects, overdueTasks, upcomingDeadlines, teamWorkload] =
      await Promise.all([
        this.prisma.project.groupBy({
          by: ['status'],
          where: projectWhere,
          _count: { _all: true },
        }),
        this.prisma.task.groupBy({
          by: ['status'],
          where: taskWhere,
          _count: { _all: true },
        }),
        this.prisma.project.count({
          where: { ...projectWhere, status: { in: [ProjectStatus.PLANNING, ProjectStatus.ACTIVE] } },
        }),
        this.prisma.task.count({
          where: { ...taskWhere, dueDate: { lt: new Date() }, status: { not: TaskStatus.DONE } },
        }),
        this.prisma.task.count({
          where: {
            ...taskWhere,
            dueDate: { gte: new Date(), lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            status: { not: TaskStatus.DONE },
          },
        }),
        this.getTeamWorkload(workspaceId, actorId, filters),
      ]);

    const totalTasks = taskGroups.reduce((sum, item) => sum + item._count._all, 0);
    const completedTasks = taskGroups.find((group) => group.status === TaskStatus.DONE)?._count._all ?? 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      workspaceId,
      workspaceName: context.workspaceName,
      role: context.role,
      reportingPeriod: { start: range.start.toISOString(), end: range.end.toISOString() },
      filters: {
        projectId: filters.projectId ?? null,
        projectStatus: filters.projectStatus ?? null,
        assigneeId: filters.assigneeId ?? null,
        taskStatus: filters.taskStatus ?? null,
        startDate: filters.startDate ?? null,
        endDate: filters.endDate ?? null,
      },
      generatedAt: new Date().toISOString(),
      dataFreshness: 'live',
      metricVersion: 'v1',
      metrics: {
        activeProjects,
        projectStatusCounts: projectGroups.map((entry) => ({ status: entry.status, count: entry._count._all })),
        taskStatusCounts: taskGroups.map((entry) => ({ status: entry.status, count: entry._count._all })),
        overdueTasks,
        upcomingDeadlines,
        completionRate,
        tasksCompletedThisWeek: completedTasks,
        teamWorkload,
      },
    };
  }

  async getTaskAnalytics(workspaceId: string, actorId: string, filters: AnalyticsFilters = {}) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);
    const range = this.normalizeDateRange(filters);
    const where = this.buildTaskWhere(workspaceId, range, filters);

    const [totals, byPriority] = await Promise.all([
      this.prisma.task.groupBy({ by: ['status'], where, _count: { _all: true } }),
      this.prisma.task.groupBy({ by: ['priority'], where, _count: { _all: true } }),
    ]);

    return {
      reportingPeriod: { start: range.start.toISOString(), end: range.end.toISOString() },
      generatedAt: new Date().toISOString(),
      dataFreshness: 'live',
      metricVersion: 'v1',
      taskStatusCounts: totals.map((entry) => ({ status: entry.status, count: entry._count._all })),
      priorityCounts: byPriority.map((entry) => ({ priority: entry.priority, count: entry._count._all })),
    };
  }

  async getProjectAnalytics(workspaceId: string, actorId: string, filters: AnalyticsFilters = {}) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);
    const range = this.normalizeDateRange(filters);
    const where = this.buildProjectWhere(workspaceId, filters);

    const groups = await this.prisma.project.groupBy({
      by: ['status'],
      where: { ...where, createdAt: { gte: range.start, lte: range.end } },
      _count: { _all: true },
    });

    return {
      reportingPeriod: { start: range.start.toISOString(), end: range.end.toISOString() },
      generatedAt: new Date().toISOString(),
      dataFreshness: 'live',
      metricVersion: 'v1',
      projectStatusCounts: groups.map((entry) => ({ status: entry.status, count: entry._count._all })),
    };
  }

  async getTeamWorkload(workspaceId: string, actorId: string, filters: AnalyticsFilters = {}) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);
    const range = this.normalizeDateRange(filters);
    const where: Prisma.TaskWhereInput = {
      workspaceId,
      deletedAt: null,
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      ...(filters.taskStatus ? { status: filters.taskStatus } : {}),
      status: { not: TaskStatus.DONE },
      createdAt: { gte: range.start, lte: range.end },
    };

    const rows = await this.prisma.task.findMany({
      where,
      select: { assigneeId: true, priority: true },
    });

    const map = new Map<string, { assigneeId: string; openTasks: number; weightedLoad: number }>();
    for (const row of rows) {
      if (!row.assigneeId) continue;
      const existing = map.get(row.assigneeId) ?? {
        assigneeId: row.assigneeId,
        openTasks: 0,
        weightedLoad: 0,
      };
      existing.openTasks += 1;
      existing.weightedLoad += this.priorityWeight(row.priority);
      map.set(row.assigneeId, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.weightedLoad - a.weightedLoad);
  }

  async getClientActivity(workspaceId: string, actorId: string, filters: AnalyticsFilters = {}) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);
    const range = this.normalizeDateRange(filters);
    const projectIds = await this.prisma.project.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        ...(filters.projectId ? { id: filters.projectId } : {}),
        ...(filters.projectStatus ? { status: filters.projectStatus } : {}),
        createdAt: { gte: range.start, lte: range.end },
      },
      select: { id: true, clientId: true },
    });

    const taskTouchedProjects = await this.prisma.task.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
        ...(filters.taskStatus ? { status: filters.taskStatus } : {}),
        createdAt: { gte: range.start, lte: range.end },
      },
      select: { projectId: true },
    });

    const clientIds = new Set<string>();
    for (const project of projectIds) {
      if (project.clientId) clientIds.add(project.clientId);
    }
    for (const task of taskTouchedProjects) {
      const match = projectIds.find((project) => project.id === task.projectId);
      if (match?.clientId) clientIds.add(match.clientId);
    }

    return {
      reportingPeriod: { start: range.start.toISOString(), end: range.end.toISOString() },
      generatedAt: new Date().toISOString(),
      dataFreshness: 'live',
      metricVersion: 'v1',
      activeClients: Array.from(clientIds).length,
    };
  }

  async getTrendMetrics(workspaceId: string, actorId: string, filters: AnalyticsFilters = {}) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);
    const range = this.normalizeDateRange(filters);
    const rows = await this.prisma.task.findMany({
      where: this.buildTaskWhere(workspaceId, range, filters),
      select: { createdAt: true, status: true },
    });

    const bucket = new Map<string, { created: number; completed: number }>();
    for (const row of rows) {
      const key = row.createdAt.toISOString().slice(0, 10);
      const current = bucket.get(key) ?? { created: 0, completed: 0 };
      current.created += 1;
      if (row.status === TaskStatus.DONE) current.completed += 1;
      bucket.set(key, current);
    }

    return {
      reportingPeriod: { start: range.start.toISOString(), end: range.end.toISOString() },
      generatedAt: new Date().toISOString(),
      metricVersion: 'v1',
      generatedSeries: Array.from(bucket.entries()).map(([date, value]) => ({
        date,
        created: value.created,
        completed: value.completed,
      })),
    };
  }

  async getPlatformAnalytics(userId: string, requiredRole: PlatformStaffRoleType) {
    await this.policyService.requirePlatformRole(userId, requiredRole);
    const stats = await this.prisma.workspace.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return {
      generatedAt: new Date().toISOString(),
      dataFreshness: 'live',
      metricVersion: 'v1',
      platformAggregates: {
        workspaceCount: stats.reduce((sum, entry) => sum + entry._count._all, 0),
        workspaceStatusCounts: stats.map((entry) => ({ status: entry.status, count: entry._count._all })),
      },
    };
  }

  private priorityWeight(priority: TaskPriority): number {
    switch (priority) {
      case TaskPriority.URGENT:
        return 4;
      case TaskPriority.HIGH:
        return 3;
      case TaskPriority.MEDIUM:
        return 2;
      default:
        return 1;
    }
  }
}
