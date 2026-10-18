import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PolicyService } from '../../common/policy/policy.service';
import { AuditLogService, recordDomainChange } from '../audit/audit.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects.dto';
import {
  ProjectStatus,
  TaskStatus,
  AuditAction,
  Prisma,
  WorkspaceRole,
  EntityType,
  ActivityAction,
} from '@prisma/client';
import { RequestMeta } from '../auth/auth.service';
import { normalizeLimit, decodeCursor, encodeCursor } from '../../common/pagination/cursor-pagination';
import {
  normalizeWorkspaceOverviewFilters,
  WorkspaceOverviewFilterValues,
} from './workspace-overview-filters';

const VALID_PROJECT_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  PLANNING: [ProjectStatus.ACTIVE, ProjectStatus.ARCHIVED],
  ACTIVE: [ProjectStatus.ON_HOLD, ProjectStatus.COMPLETED, ProjectStatus.ARCHIVED],
  ON_HOLD: [ProjectStatus.ACTIVE, ProjectStatus.ARCHIVED],
  COMPLETED: [ProjectStatus.ARCHIVED],
  ARCHIVED: [],
};

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: PolicyService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createProject(
    workspaceId: string,
    actorId: string,
    dto: CreateProjectDto,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.MEMBER,
    );

    if (dto.clientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: dto.clientId, workspaceId, deletedAt: null },
      });
      if (!client) {
        throw new BadRequestException('Client does not belong to this workspace');
      }
    }
    if (dto.startDate && dto.endDate && new Date(dto.startDate) > new Date(dto.endDate)) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }
    if (
      dto.status !== undefined &&
      dto.status !== ProjectStatus.PLANNING &&
      dto.status !== ProjectStatus.ACTIVE
    ) {
      throw new BadRequestException('Projects must be created in PLANNING or ACTIVE status');
    }

    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          workspaceId,
          clientId: dto.clientId ?? null,
          name: dto.name.trim(),
          description: dto.description ?? null,
          status: dto.status ?? ProjectStatus.PLANNING,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          createdBy: actorId,
        },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.PROJECT,
        entityId: created.id,
        activityAction: ActivityAction.PROJECT_CREATE,
        auditAction: AuditAction.PROJECT_CREATE,
        targetType: 'Project',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'create' },
      });

      return created;
    });

    return project;
  }

  async listProjects(
    workspaceId: string,
    actorId: string,
    dto: ListProjectsQueryDto,
  ) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const limit = normalizeLimit({ limit: dto.limit, maxLimit: 50, defaultLimit: 20 });
    const cursor = decodeCursor(dto.cursor);

    const where: Prisma.ProjectWhereInput = {
      workspaceId,
      deletedAt:
        dto.status === ProjectStatus.ARCHIVED
          ? { not: null }
          : null,
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.clientId ? { clientId: dto.clientId } : {}),
      ...(dto.startDateFrom || dto.startDateTo
        ? {
            startDate: {
              ...(dto.startDateFrom ? { gte: new Date(dto.startDateFrom) } : {}),
              ...(dto.startDateTo ? { lte: new Date(dto.startDateTo) } : {}),
            },
          }
        : {}),
      ...(dto.q
        ? {
            OR: [
              { name: { contains: dto.q, mode: 'insensitive' as const } },
              { description: { contains: dto.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    if (
      dto.startDateFrom &&
      dto.startDateTo &&
      new Date(dto.startDateFrom) > new Date(dto.startDateTo)
    ) {
      throw new BadRequestException('startDateFrom must be before or equal to startDateTo');
    }
    const direction = dto.sortOrder ?? 'desc';
    const orderBy: Prisma.ProjectOrderByWithRelationInput[] = [
      dto.sortBy === 'name' ? { name: direction } :
      dto.sortBy === 'status' ? { status: direction } :
      dto.sortBy === 'startDate' ? { startDate: direction } :
      { createdAt: direction },
      { id: 'desc' },
    ];

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : undefined,
        orderBy,
        include: {
          client: true,
          _count: { select: { tasks: { where: { deletedAt: null } } } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, -1) : data;
    const nextCursor = hasMore ? encodeCursor(items[items.length - 1]!.id) : null;

    return {
      data: items,
      nextCursor,
      hasMore,
      total,
      limit,
    };
  }

  async getProject(workspaceId: string, actorId: string, projectId: string) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      include: { client: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async getWorkspaceOverview(
    workspaceId: string,
    actorId: string,
    filterValues: WorkspaceOverviewFilterValues = {},
  ) {
    const context = await this.policyService.getWorkspaceContext(actorId, workspaceId);
    const filters = normalizeWorkspaceOverviewFilters(filterValues);
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const projectWhere: Prisma.ProjectWhereInput = {
      workspaceId,
      deletedAt: null,
      ...(filters.projectId ? { id: filters.projectId } : {}),
      ...(filters.projectStatus ? { status: filters.projectStatus } : {}),
      ...(filters.createdAt ? { createdAt: filters.createdAt } : {}),
    };
    const taskWhere: Prisma.TaskWhereInput = {
      workspaceId,
      deletedAt: null,
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      ...(filters.createdAt ? { createdAt: filters.createdAt } : {}),
      ...(filters.projectStatus ? { project: { is: { status: filters.projectStatus } } } : {}),
    };
    const taskStatusFilter = filters.taskStatus ? [{ status: filters.taskStatus }] : [];

    const [projectGroups, taskGroups, overdueTasks, upcomingDeadlines] = await Promise.all([
      this.prisma.project.groupBy({
        by: ['status'],
        where: projectWhere,
        _count: { _all: true },
      }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { ...taskWhere, ...(filters.taskStatus ? { status: filters.taskStatus } : {}) },
        _count: { _all: true },
      }),
      this.prisma.task.count({
        where: {
          ...taskWhere,
          dueDate: { lt: now },
          AND: [{ status: { not: TaskStatus.DONE } }, ...taskStatusFilter],
        },
      }),
      this.prisma.task.count({
        where: {
          ...taskWhere,
          dueDate: { gte: now, lt: nextWeek },
          AND: [{ status: { not: TaskStatus.DONE } }, ...taskStatusFilter],
        },
      }),
    ]);

    const projectStatusCounts = projectGroups.map(({ status, _count }) => ({
      status,
      count: _count._all,
    }));
    const taskStatusCounts = taskGroups.map(({ status, _count }) => ({
      status,
      count: _count._all,
    }));

    return {
      workspaceId,
      workspaceName: context.workspaceName,
      role: context.role,
      projectCount: projectStatusCounts.reduce((sum, item) => sum + item.count, 0),
      taskCount: taskStatusCounts.reduce((sum, item) => sum + item.count, 0),
      projectStatusCounts,
      taskStatusCounts,
      overdueTasks,
      upcomingDeadlines,
    };
  }

  async updateProject(
    workspaceId: string,
    actorId: string,
    projectId: string,
    dto: UpdateProjectDto,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.MEMBER,
    );
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('At least one project field must be provided');
    }

    const existing = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    const nextStartDate =
      dto.startDate === undefined
        ? existing.startDate
        : dto.startDate
          ? new Date(dto.startDate)
          : null;
    const nextEndDate =
      dto.endDate === undefined
        ? existing.endDate
        : dto.endDate
          ? new Date(dto.endDate)
          : null;
    if (nextStartDate && nextEndDate && nextStartDate > nextEndDate) {
      throw new BadRequestException('startDate must be before or equal to endDate');
    }

    if (dto.clientId !== undefined) {
      if (dto.clientId === null) {
        // explicit null to unset - allowed
      } else {
        const client = await this.prisma.client.findFirst({
          where: { id: dto.clientId, workspaceId, deletedAt: null },
        });
        if (!client) {
          throw new BadRequestException('Client does not belong to this workspace');
        }
      }
    }

    if (dto.status !== undefined && dto.status !== existing.status) {
      this.validateProjectTransition(existing.status, dto.status);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: projectId },
        data: {
          name: dto.name !== undefined ? dto.name.trim() : undefined,
          description: dto.description !== undefined ? dto.description : undefined,
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.clientId !== undefined ? { clientId: dto.clientId } : {}),
          ...(dto.startDate !== undefined ? { startDate: dto.startDate ? new Date(dto.startDate) : null } : {}),
          ...(dto.endDate !== undefined ? { endDate: dto.endDate ? new Date(dto.endDate) : null } : {}),
        },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.PROJECT,
        entityId: project.id,
        activityAction: ActivityAction.PROJECT_UPDATE,
        auditAction: AuditAction.PROJECT_UPDATE,
        targetType: 'Project',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'update' },
      });

      return project;
    });

    return updated;
  }

  private validateProjectTransition(current: ProjectStatus, next: ProjectStatus): void {
    if (current === next) return;
    if (next === ProjectStatus.ARCHIVED) {
      throw new BadRequestException('Use the archive endpoint to archive a project');
    }
    const allowed = VALID_PROJECT_TRANSITIONS[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid project status transition from ${current} to ${next}`,
      );
    }
  }

  async archiveProject(
    workspaceId: string,
    actorId: string,
    projectId: string,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.TEAM_ADMIN,
    );

    const existing = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    const activeTasks = await this.prisma.task.count({
      where: {
        projectId,
        workspaceId,
        deletedAt: null,
      },
    });

    if (activeTasks > 0) {
      throw new BadRequestException('Cannot archive project with active tasks');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.ARCHIVED, deletedAt: new Date() },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.PROJECT,
        entityId: project.id,
        activityAction: ActivityAction.PROJECT_ARCHIVE,
        auditAction: AuditAction.PROJECT_ARCHIVE,
        targetType: 'Project',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'archive' },
      });

      return project;
    });

    return updated;
  }

  async restoreProject(
    workspaceId: string,
    actorId: string,
    projectId: string,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.TEAM_ADMIN,
    );

    const existing = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: { not: null } },
    });

    if (!existing) {
      throw new NotFoundException('Project not found or not archived');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.ACTIVE, deletedAt: null },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.PROJECT,
        entityId: project.id,
        activityAction: ActivityAction.PROJECT_RESTORE,
        auditAction: AuditAction.PROJECT_RESTORE,
        targetType: 'Project',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'restore' },
      });

      return project;
    });

    return updated;
  }
}
