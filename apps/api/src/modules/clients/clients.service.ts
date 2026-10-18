import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PolicyService } from '../../common/policy/policy.service';
import { AuditLogService, recordDomainChange } from '../audit/audit.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsQueryDto } from './dto/list-clients.dto';
import {
  ClientStatus,
  ProjectStatus,
  AuditAction,
  Prisma,
  WorkspaceRole,
  EntityType,
  ActivityAction,
} from '@prisma/client';
import { RequestMeta } from '../auth/auth.service';
import { normalizeLimit, decodeCursor, encodeCursor } from '../../common/pagination/cursor-pagination';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: PolicyService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createClient(
    workspaceId: string,
    actorId: string,
    dto: CreateClientDto,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.MEMBER,
    );

    const client = await this.prisma.$transaction(async (tx) => {
      const created = await tx.client.create({
        data: {
          workspaceId,
          name: dto.name.trim(),
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          website: dto.website ?? null,
          address: dto.address ?? null,
          notes: dto.notes ?? null,
          status: ClientStatus.ACTIVE,
          createdBy: actorId,
        },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.CLIENT,
        entityId: created.id,
        activityAction: ActivityAction.CLIENT_CREATE,
        auditAction: AuditAction.CLIENT_CREATE,
        targetType: 'Client',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'create' },
      });

      return created;
    });

    return client;
  }

  async listClients(
    workspaceId: string,
    actorId: string,
    dto: ListClientsQueryDto,
  ) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const limit = normalizeLimit({ limit: dto.limit, maxLimit: 50, defaultLimit: 20 });
    const cursor = decodeCursor(dto.cursor);

    const where: Prisma.ClientWhereInput = {
      workspaceId,
      deletedAt:
        dto.status === ClientStatus.ARCHIVED
          ? { not: null }
          : null,
      ...(dto.status ? { status: dto.status } : {}),
      ...(dto.createdAfter || dto.createdBefore
        ? {
            createdAt: {
              ...(dto.createdAfter ? { gte: new Date(dto.createdAfter) } : {}),
              ...(dto.createdBefore ? { lte: new Date(dto.createdBefore) } : {}),
            },
          }
        : {}),
      ...(dto.q
        ? {
            OR: [
              { name: { contains: dto.q, mode: 'insensitive' as const } },
              { email: { contains: dto.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    if (
      dto.createdAfter &&
      dto.createdBefore &&
      new Date(dto.createdAfter) > new Date(dto.createdBefore)
    ) {
      throw new BadRequestException('createdAfter must be before or equal to createdBefore');
    }
    const direction = dto.sortOrder ?? 'desc';
    const orderBy: Prisma.ClientOrderByWithRelationInput[] = [
      dto.sortBy === 'name' ? { name: direction } :
      dto.sortBy === 'status' ? { status: direction } :
      { createdAt: direction },
      { id: 'desc' },
    ];

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : undefined,
        orderBy,
      }),
      this.prisma.client.count({ where }),
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

  async getClient(workspaceId: string, actorId: string, clientId: string) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const client = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId, deletedAt: null },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async updateClient(
    workspaceId: string,
    actorId: string,
    clientId: string,
    dto: UpdateClientDto,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.MEMBER,
    );
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('At least one client field must be provided');
    }

    const existing = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.update({
        where: { id: clientId },
        data: {
          name: dto.name !== undefined ? dto.name.trim() : undefined,
          email: dto.email !== undefined ? dto.email : undefined,
          phone: dto.phone !== undefined ? dto.phone : undefined,
          website: dto.website !== undefined ? dto.website : undefined,
          address: dto.address !== undefined ? dto.address : undefined,
          notes: dto.notes !== undefined ? dto.notes : undefined,
        },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.CLIENT,
        entityId: client.id,
        activityAction: ActivityAction.CLIENT_UPDATE,
        auditAction: AuditAction.CLIENT_UPDATE,
        targetType: 'Client',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'update' },
      });

      return client;
    });

    return updated;
  }

  async archiveClient(
    workspaceId: string,
    actorId: string,
    clientId: string,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.TEAM_ADMIN,
    );

    const existing = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Client not found');
    }

    const activeProjects = await this.prisma.project.count({
      where: {
        clientId,
        workspaceId,
        deletedAt: null,
        status: { not: ProjectStatus.ARCHIVED },
      },
    });

    if (activeProjects > 0) {
      throw new BadRequestException('Cannot archive client with active projects');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.update({
        where: { id: clientId },
        data: { status: ClientStatus.ARCHIVED, deletedAt: new Date() },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.CLIENT,
        entityId: client.id,
        activityAction: ActivityAction.CLIENT_ARCHIVE,
        auditAction: AuditAction.CLIENT_ARCHIVE,
        targetType: 'Client',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'archive' },
      });

      return client;
    });

    return updated;
  }

  async restoreClient(
    workspaceId: string,
    actorId: string,
    clientId: string,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.TEAM_ADMIN,
    );

    const existing = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId, deletedAt: { not: null } },
    });

    if (!existing) {
      throw new NotFoundException('Client not found or not archived');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.update({
        where: { id: clientId },
        data: { status: ClientStatus.ACTIVE, deletedAt: null },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.CLIENT,
        entityId: client.id,
        activityAction: ActivityAction.CLIENT_RESTORE,
        auditAction: AuditAction.CLIENT_RESTORE,
        targetType: 'Client',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'restore' },
      });

      return client;
    });

    return updated;
  }
}
