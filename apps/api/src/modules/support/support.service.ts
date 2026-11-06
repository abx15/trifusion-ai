import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { PolicyService } from '../../common/policy/policy.service';
import { TicketStatus, TicketPriority, WorkspaceMemberStatus } from '@prisma/client';
import { RequestMeta } from '../auth/auth.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  UpdateTicketStatusDto,
  CreateSessionDto,
} from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly policyService: PolicyService
  ) {}

  async listTickets(
    workspaceId: string,
    actorId: string,
    filters: {
      status?: string;
      priority?: string;
      assigneeId?: string;
      limit?: number;
      cursor?: string;
    }
  ) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const where: any = { workspaceId };
    if (filters.status) where.status = filters.status as TicketStatus;
    if (filters.priority) where.priority = filters.priority as TicketPriority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;

    const take = Math.min(filters.limit || 20, 100);
    const [total, tickets] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        take,
        skip: filters.cursor ? 1 : 0,
        cursor: filters.cursor ? { id: filters.cursor } : undefined,
        include: {
          requester: { select: { id: true, email: true } },
          assignee: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      total,
      tickets,
      limit: take,
      hasMore: tickets.length === take && total > take,
      nextCursor: tickets.length > 0 ? tickets[tickets.length - 1].id : null,
    };
  }

  async listAllTickets(filters: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status as TicketStatus;
    if (filters.priority) where.priority = filters.priority as TicketPriority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;

    const take = Math.min(filters.limit || 20, 100);
    const [
      total,
      tickets,
      openTickets,
      assignedTickets,
      pendingCustomerResponses,
      criticalIncidents,
      slaBreaches,
      resolution,
    ] = await Promise.all([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        take,
        skip: filters.cursor ? 1 : 0,
        cursor: filters.cursor ? { id: filters.cursor } : undefined,
        include: {
          requester: { select: { id: true, email: true } },
          assignee: { select: { id: true, email: true } },
          workspace: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count({
        where: { ...where, status: { notIn: ['RESOLVED', 'CLOSED'] } },
      }),
      this.prisma.supportTicket.count({ where: { ...where, assigneeId: { not: null } } }),
      this.prisma.supportTicket.count({ where: { ...where, status: 'WAITING_ON_CUSTOMER' } }),
      this.prisma.supportTicket.count({ where: { ...where, priority: 'CRITICAL' } }),
      this.prisma.supportTicket.count({ where: { ...where, slaBreached: true } }),
      this.prisma.$queryRaw<Array<{ averageHours: number | null }>>`
        SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600) AS "averageHours"
        FROM "SupportTicket"
        WHERE "resolvedAt" IS NOT NULL
      `,
    ]);

    return {
      total,
      tickets,
      limit: take,
      hasMore: tickets.length === take && total > 0,
      nextCursor: tickets.length > 0 ? tickets[tickets.length - 1].id : null,
      summary: {
        openTickets,
        assignedTickets,
        pendingCustomerResponses,
        criticalIncidents,
        slaBreaches,
        averageResolutionHours: resolution[0]?.averageHours ?? null,
      },
    };
  }

  async listAllSessions(filters: { status?: string; limit?: number; cursor?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;

    const take = Math.min(filters.limit || 20, 100);
    const [total, sessions] = await Promise.all([
      this.prisma.supportSession.count({ where }),
      this.prisma.supportSession.findMany({
        where,
        take,
        skip: filters.cursor ? 1 : 0,
        cursor: filters.cursor ? { id: filters.cursor } : undefined,
        include: {
          agent: { select: { id: true, email: true } },
          ticket: { select: { id: true, title: true } },
          workspace: { select: { id: true, name: true } },
        },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    return {
      total,
      sessions,
      limit: take,
      hasMore: sessions.length === take && total > 0,
      nextCursor: sessions.length > 0 ? sessions[sessions.length - 1].id : null,
    };
  }

  async getTicket(workspaceId: string, ticketId: string, actorId: string) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        requester: { select: { id: true, email: true } },
        assignee: { select: { id: true, email: true } },
        workspace: { select: { id: true, name: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.workspaceId !== workspaceId)
      throw new ForbiddenException('Ticket does not belong to this workspace');
    return ticket;
  }

  async createTicket(
    workspaceId: string,
    actorId: string,
    dto: CreateTicketDto,
    meta: RequestMeta
  ) {
    await this.policyService.requireWorkspaceRole(actorId, workspaceId, 'MEMBER');
    const ticket = await this.prisma.supportTicket.create({
      data: {
        workspaceId,
        title: dto.title,
        description: dto.description,
        status: TicketStatus.OPEN,
        priority: dto.priority as TicketPriority,
        requesterId: actorId,
      },
      include: {
        requester: { select: { id: true, email: true } },
        assignee: { select: { id: true, email: true } },
      },
    });

    await this.auditLogService.log({
      actorId,
      action: 'TICKET_CREATE' as any,
      targetType: 'SupportTicket',
      targetId: ticket.id,
      workspaceId,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { title: dto.title, priority: dto.priority },
      actorType: 'USER',
    });

    return ticket;
  }

  async updateTicket(
    workspaceId: string,
    ticketId: string,
    actorId: string,
    dto: UpdateTicketDto,
    meta: RequestMeta
  ) {
    const ticket = await this.getTicket(workspaceId, ticketId, actorId);
    const context = await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const canEdit =
      context.role === 'OWNER' ||
      context.role === 'TEAM_ADMIN' ||
      (context.role === 'MEMBER' && ticket.requesterId === actorId);

    if (!canEdit) {
      throw new ForbiddenException('Insufficient permissions to update this ticket');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status as TicketStatus }),
        ...(dto.priority !== undefined && { priority: dto.priority as TicketPriority }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
      },
      include: {
        requester: { select: { id: true, email: true } },
        assignee: { select: { id: true, email: true } },
      },
    });

    await this.auditLogService.log({
      actorId,
      action: 'TICKET_UPDATE' as any,
      targetType: 'SupportTicket',
      targetId: ticketId,
      workspaceId,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { updates: dto },
      actorType: 'USER',
    });

    return updated;
  }

  async updateTicketStatus(
    workspaceId: string,
    ticketId: string,
    actorId: string,
    dto: UpdateTicketStatusDto,
    meta: RequestMeta
  ) {
    const ticket = await this.getTicket(workspaceId, ticketId, actorId);
    const context = await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const canChangeStatus =
      context.role === 'OWNER' ||
      context.role === 'TEAM_ADMIN' ||
      (context.role === 'MEMBER' && ticket.requesterId === actorId);

    if (!canChangeStatus) {
      throw new ForbiddenException('Insufficient permissions to change ticket status');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: dto.status as TicketStatus,
        ...(dto.status === 'RESOLVED' && { resolvedAt: new Date() }),
        ...(dto.status === 'CLOSED' && { closedAt: new Date() }),
      },
      include: {
        requester: { select: { id: true, email: true } },
        assignee: { select: { id: true, email: true } },
      },
    });

    await this.auditLogService.log({
      actorId,
      action: 'TICKET_STATUS_CHANGE' as any,
      targetType: 'SupportTicket',
      targetId: ticketId,
      workspaceId,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { oldStatus: ticket.status, newStatus: dto.status },
      actorType: 'USER',
    });

    return updated;
  }

  async archiveTicket(workspaceId: string, ticketId: string, actorId: string, meta: RequestMeta) {
    const ticket = await this.getTicket(workspaceId, ticketId, actorId);
    await this.policyService.requireWorkspaceRole(actorId, workspaceId, 'TEAM_ADMIN');

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: TicketStatus.CLOSED },
      include: {
        requester: { select: { id: true, email: true } },
        assignee: { select: { id: true, email: true } },
      },
    });

    await this.auditLogService.log({
      actorId,
      action: 'TICKET_ARCHIVE' as any,
      targetType: 'SupportTicket',
      targetId: ticketId,
      workspaceId,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { oldStatus: ticket.status },
      actorType: 'USER',
    });

    return updated;
  }

  async assignTicket(
    workspaceId: string,
    ticketId: string,
    actorId: string,
    assigneeId: string,
    meta: RequestMeta
  ) {
    await this.getTicket(workspaceId, ticketId, actorId);
    await this.policyService.requireWorkspaceRole(actorId, workspaceId, 'TEAM_ADMIN');

    // Verify assignee is a member of the workspace
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: assigneeId } },
    });
    if (!membership || membership.status !== WorkspaceMemberStatus.ACTIVE) {
      throw new NotFoundException('Assignee is not an active member of this workspace');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assigneeId },
      include: {
        requester: { select: { id: true, email: true } },
        assignee: { select: { id: true, email: true } },
      },
    });

    await this.auditLogService.log({
      actorId,
      action: 'TICKET_ASSIGN' as any,
      targetType: 'SupportTicket',
      targetId: ticketId,
      workspaceId,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { assigneeId },
      actorType: 'USER',
    });

    return updated;
  }

  async createSession(actorId: string, dto: CreateSessionDto, meta: RequestMeta) {
    await this.policyService.requireWorkspaceRole(actorId, dto.workspaceId, 'MEMBER');

    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await this.prisma.supportSession.create({
      data: {
        workspaceId: dto.workspaceId,
        agentId: actorId,
        ticketId: dto.ticketId ?? undefined,
        reason: dto.reason,
        scope: dto.scope,
        status: 'ACTIVE',
        startedAt: new Date(),
        expiresAt,
        consentGiven: false,
      },
      include: {
        workspace: { select: { id: true, name: true } },
        agent: { select: { id: true, email: true } },
        ticket: { select: { id: true, title: true } },
      },
    });

    await this.auditLogService.log({
      actorId,
      action: 'PLATFORM_SUPPORT_ACCESS' as any,
      targetType: 'SupportSession',
      targetId: session.id,
      workspaceId: dto.workspaceId,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { reason: dto.reason, scope: dto.scope, expiresAt },
      actorType: 'PLATFORM_STAFF',
      grantId: session.id,
    });

    return session;
  }

  async listSessions(
    workspaceId: string,
    actorId: string,
    filters: { status?: string; limit?: number; cursor?: string }
  ) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const where: any = { workspaceId };
    if (filters.status) where.status = filters.status;

    const take = Math.min(filters.limit || 20, 100);
    const [total, sessions] = await Promise.all([
      this.prisma.supportSession.count({ where }),
      this.prisma.supportSession.findMany({
        where,
        take,
        skip: filters.cursor ? 1 : 0,
        cursor: filters.cursor ? { id: filters.cursor } : undefined,
        include: {
          agent: { select: { id: true, email: true } },
          ticket: { select: { id: true, title: true } },
        },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    return {
      total,
      sessions,
      limit: take,
      hasMore: sessions.length === take && total > 0,
      nextCursor: sessions.length > 0 ? sessions[sessions.length - 1].id : null,
    };
  }

  async endSession(sessionId: string, actorId: string, meta: RequestMeta) {
    const session = await this.prisma.supportSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');

    await this.policyService.getWorkspaceContext(actorId, session.workspaceId);

    const updated = await this.prisma.supportSession.update({
      where: { id: sessionId },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    await this.auditLogService.log({
      actorId,
      action: 'PLATFORM_SUPPORT_ACCESS' as any,
      targetType: 'SupportSession',
      targetId: sessionId,
      workspaceId: session.workspaceId,
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      metadata: { action: 'session_ended' },
      actorType: 'PLATFORM_STAFF',
      grantId: sessionId,
    });

    return updated;
  }
}
