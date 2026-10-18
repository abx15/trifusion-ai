import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PolicyService } from '../../common/policy/policy.service';
import { AuditLogService, recordDomainChange } from '../audit/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { ListTasksQueryDto } from './dto/list-tasks.dto';
import {
  TaskStatus,
  TaskPriority,
  AuditAction,
  Prisma,
  WorkspaceRole,
  EntityType,
  ActivityAction,
  WorkspaceMemberStatus,
} from '@prisma/client';
import { RequestMeta } from '../auth/auth.service';
import { normalizeLimit, decodeCursor, encodeCursor } from '../../common/pagination/cursor-pagination';

const VALID_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: [TaskStatus.IN_PROGRESS],
  IN_PROGRESS: [TaskStatus.REVIEW, TaskStatus.TODO],
  REVIEW: [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
  DONE: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
};

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: PolicyService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createTask(
    workspaceId: string,
    actorId: string,
    dto: CreateTaskDto,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.MEMBER,
    );

    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, workspaceId, deletedAt: null },
    });
    if (!project) {
      throw new BadRequestException('Project does not belong to this workspace');
    }

    if (dto.status && dto.status !== TaskStatus.TODO) {
      throw new BadRequestException('Tasks must be created in TODO status');
    }

    if (dto.assigneeId) {
      const membership = await this.prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: dto.assigneeId,
          status: WorkspaceMemberStatus.ACTIVE,
        },
      });
      if (!membership) {
        throw new BadRequestException('Assignee is not an active member of this workspace');
      }
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const activeProject = await tx.project.findFirst({
        where: { id: dto.projectId, workspaceId, deletedAt: null },
        select: { id: true },
      });
      if (!activeProject) {
        throw new BadRequestException('Project does not belong to this workspace');
      }
      if (dto.assigneeId) {
        const activeMembership = await tx.workspaceMember.findFirst({
          where: {
            workspaceId,
            userId: dto.assigneeId,
            status: WorkspaceMemberStatus.ACTIVE,
          },
          select: { id: true },
        });
        if (!activeMembership) {
          throw new BadRequestException('Assignee is not an active member of this workspace');
        }
      }

      const created = await tx.task.create({
        data: {
          workspaceId,
          projectId: dto.projectId,
          assigneeId: dto.assigneeId ?? null,
          title: dto.title.trim(),
          description: dto.description ?? null,
          status: dto.status ?? TaskStatus.TODO,
          priority: dto.priority ?? TaskPriority.MEDIUM,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          createdBy: actorId,
        },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.TASK,
        entityId: created.id,
        activityAction: ActivityAction.TASK_CREATE,
        auditAction: AuditAction.TASK_CREATE,
        targetType: 'Task',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'create' },
      });

      return created;
    });

    return task;
  }

  async listTasks(
    workspaceId: string,
    actorId: string,
    dto: ListTasksQueryDto,
  ) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const limit = normalizeLimit({ limit: dto.limit, maxLimit: 50, defaultLimit: 20 });
    const cursor = decodeCursor(dto.cursor);

    const where: Prisma.TaskWhereInput = {
      workspaceId,
      ...(dto.includeArchived ? {} : { deletedAt: null }),
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.priority ? { priority: dto.priority } : {}),
      ...(dto.projectId ? { projectId: dto.projectId } : {}),
      ...(dto.assigneeId ? { assigneeId: dto.assigneeId } : {}),
      ...(dto.clientId || dto.projectStatus
        ? {
            project: {
              ...(dto.clientId ? { clientId: dto.clientId } : {}),
              ...(dto.projectStatus ? { status: dto.projectStatus } : {}),
            },
          }
        : {}),
      ...(dto.dueDateFrom || dto.dueDateTo
        ? {
            dueDate: {
              ...(dto.dueDateFrom ? { gte: new Date(dto.dueDateFrom) } : {}),
              ...(dto.dueDateTo ? { lte: new Date(dto.dueDateTo) } : {}),
            },
          }
        : {}),
      ...(dto.overdue === true
        ? {
            AND: [
              { dueDate: { lt: new Date() } },
              { status: { not: TaskStatus.DONE } },
            ],
          }
        : {}),
      ...(dto.q
        ? {
            OR: [
              { title: { contains: dto.q, mode: 'insensitive' as const } },
              { description: { contains: dto.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    if (
      dto.dueDateFrom &&
      dto.dueDateTo &&
      new Date(dto.dueDateFrom) > new Date(dto.dueDateTo)
    ) {
      throw new BadRequestException('dueDateFrom must be before or equal to dueDateTo');
    }
    const direction = dto.sortOrder ?? 'desc';
    const orderBy: Prisma.TaskOrderByWithRelationInput[] = [
      dto.sortBy === 'dueDate' ? { dueDate: direction } :
      dto.sortBy === 'priority' ? { priority: direction } :
      dto.sortBy === 'status' ? { status: direction } :
      { createdAt: direction },
      { id: 'desc' },
    ];

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : undefined,
        orderBy,
        include: {
          project: {
            include: {
              client: true,
              _count: { select: { tasks: { where: { deletedAt: null } } } },
            },
          },
          assignee: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  profile: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.task.count({ where }),
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

  async getTask(workspaceId: string, actorId: string, taskId: string) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId, deletedAt: null },
      include: {
        project: {
          include: {
            client: true,
            _count: { select: { tasks: { where: { deletedAt: null } } } },
          },
        },
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async updateTask(
    workspaceId: string,
    actorId: string,
    taskId: string,
    dto: UpdateTaskDto,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.MEMBER,
    );
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('At least one task field must be provided');
    }

    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    if (dto.projectId !== undefined && dto.projectId !== existing.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, workspaceId, deletedAt: null },
      });
      if (!project) {
        throw new BadRequestException('Project does not belong to this workspace');
      }
    }

    if (dto.assigneeId !== undefined) {
      if (dto.assigneeId !== null) {
        const membership = await this.prisma.workspaceMember.findFirst({
          where: {
            workspaceId,
            userId: dto.assigneeId,
            status: WorkspaceMemberStatus.ACTIVE,
          },
        });
        if (!membership) {
          throw new BadRequestException('Assignee is not an active member of this workspace');
        }
      }
    }

    if (dto.status !== undefined && dto.status !== existing.status) {
      this.validateTaskTransition(existing.status, dto.status);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.projectId !== undefined && dto.projectId !== existing.projectId) {
        const activeProject = await tx.project.findFirst({
          where: { id: dto.projectId, workspaceId, deletedAt: null },
          select: { id: true },
        });
        if (!activeProject) {
          throw new BadRequestException('Project does not belong to this workspace');
        }
      }
      if (dto.assigneeId) {
        const activeMembership = await tx.workspaceMember.findFirst({
          where: {
            workspaceId,
            userId: dto.assigneeId,
            status: WorkspaceMemberStatus.ACTIVE,
          },
          select: { id: true },
        });
        if (!activeMembership) {
          throw new BadRequestException('Assignee is not an active member of this workspace');
        }
      }

      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
          ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
          ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null } : {}),
        },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.TASK,
        entityId: task.id,
        activityAction:
          dto.assigneeId !== undefined
            ? dto.assigneeId === null
              ? ActivityAction.TASK_UNASSIGN
              : ActivityAction.TASK_ASSIGN
            : ActivityAction.TASK_UPDATE,
        auditAction: AuditAction.TASK_UPDATE,
        targetType: 'Task',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'update' },
      });

      return task;
    });

    return updated;
  }

  async updateTaskStatus(
    workspaceId: string,
    actorId: string,
    taskId: string,
    dto: UpdateTaskStatusDto,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.MEMBER,
    );

    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    this.validateTaskTransition(existing.status, dto.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: { status: dto.status },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.TASK,
        entityId: task.id,
        activityAction: ActivityAction.TASK_STATUS_CHANGE,
        auditAction: AuditAction.TASK_STATUS_CHANGE,
        targetType: 'Task',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { from: existing.status, to: dto.status },
      });

      return task;
    });

    return updated;
  }

  private validateTaskTransition(current: TaskStatus, next: TaskStatus): void {
    if (current === next) return;
    const allowed = VALID_TASK_TRANSITIONS[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid task status transition from ${current} to ${next}`,
      );
    }
  }

  async archiveTask(
    workspaceId: string,
    actorId: string,
    taskId: string,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.TEAM_ADMIN,
    );

    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: { deletedAt: new Date() },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.TASK,
        entityId: task.id,
        activityAction: ActivityAction.TASK_ARCHIVE,
        auditAction: AuditAction.TASK_ARCHIVE,
        targetType: 'Task',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'archive' },
      });

      return task;
    });

    return updated;
  }

  async restoreTask(
    workspaceId: string,
    actorId: string,
    taskId: string,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.TEAM_ADMIN,
    );

    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId, deletedAt: { not: null } },
    });

    if (!existing) {
      throw new NotFoundException('Task not found or not archived');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: taskId },
        data: { deletedAt: null },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.TASK,
        entityId: task.id,
        activityAction: ActivityAction.TASK_RESTORE,
        auditAction: AuditAction.TASK_RESTORE,
        targetType: 'Task',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'restore' },
      });

      return task;
    });

    return updated;
  }
}
