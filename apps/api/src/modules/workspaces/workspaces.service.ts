import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PolicyService } from '../../common/policy/policy.service';
import { AuditLogService } from '../audit/audit.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import {
  WorkspaceRole,
  WorkspaceStatus,
  WorkspaceMemberStatus,
  AuditAction,
} from '@prisma/client';
import { RequestMeta } from '../auth/auth.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: PolicyService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateSlug(text: string): string {
    const base = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    return `${base || 'workspace'}-${randomSuffix}`;
  }

  /**
   * Create a new company workspace
   */
  async createWorkspace(userId: string, dto: CreateWorkspaceDto, meta?: RequestMeta) {
    const user = await this.policyService.resolveUser(userId);
    const slug = this.generateSlug(dto.name);

    const workspace = await this.prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: dto.name.trim(),
          slug,
          type: 'COMPANY',
          status: WorkspaceStatus.ACTIVE,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: WorkspaceRole.OWNER,
              status: WorkspaceMemberStatus.ACTIVE,
            },
          },
        },
      });

      return ws;
    });

    await this.auditLogService.log({
      actorId: user.id,
      action: AuditAction.WORKSPACE_CREATE,
      targetType: 'Workspace',
      targetId: workspace.id,
      workspaceId: workspace.id,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { name: workspace.name, type: workspace.type },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      type: workspace.type,
      status: workspace.status,
      role: WorkspaceRole.OWNER,
      createdAt: workspace.createdAt,
    };
  }

  /**
   * List all workspaces where user has active membership
   */
  async listUserWorkspaces(userId: string) {
    return this.policyService.listUserWorkspaces(userId);
  }

  /**
   * Get single workspace details
   */
  async getWorkspace(workspaceId: string, userId: string) {
    const context = await this.policyService.getWorkspaceContext(userId, workspaceId);

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: {
          select: {
            members: {
              where: { status: WorkspaceMemberStatus.ACTIVE },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      type: workspace.type,
      status: workspace.status,
      myRole: context.role,
      activeMembersCount: workspace._count.members,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  /**
   * Update workspace settings (name)
   */
  async updateWorkspace(
    workspaceId: string,
    userId: string,
    dto: UpdateWorkspaceDto,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(userId, workspaceId, WorkspaceRole.TEAM_ADMIN);

    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: dto.name.trim(),
      },
    });

    await this.auditLogService.log({
      actorId: userId,
      action: AuditAction.WORKSPACE_UPDATE,
      targetType: 'Workspace',
      targetId: workspaceId,
      workspaceId,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { newName: dto.name },
    });

    return updated;
  }

  /**
   * List all active members in workspace
   */
  async listMembers(workspaceId: string, userId: string) {
    await this.policyService.getWorkspaceContext(userId, workspaceId);

    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.user.id,
      email: m.user.email,
      name: `${m.user.profile?.firstName || ''} ${m.user.profile?.lastName || ''}`.trim(),
      avatarUrl: m.user.profile?.avatarUrl || null,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * Update member role with strict escalation prevention
   */
  async updateMemberRole(
    workspaceId: string,
    actorId: string,
    targetUserId: string,
    newRole: WorkspaceRole,
    meta?: RequestMeta,
  ) {
    const actorContext = await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const targetMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership || targetMembership.status !== WorkspaceMemberStatus.ACTIVE) {
      throw new NotFoundException('Target member not found in this workspace');
    }

    const ownerCount = await this.prisma.workspaceMember.count({
      where: {
        workspaceId,
        role: WorkspaceRole.OWNER,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    // Check escalation rules
    this.policyService.validateRoleChange(
      actorContext.role,
      targetMembership.role,
      newRole,
      actorId === targetUserId,
      ownerCount,
    );

    const updated = await this.prisma.workspaceMember.update({
      where: { id: targetMembership.id },
      data: { role: newRole },
    });

    await this.auditLogService.log({
      actorId,
      action: AuditAction.MEMBER_ROLE_CHANGE,
      targetType: 'WorkspaceMember',
      targetId: updated.id,
      workspaceId,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: {
        targetUserId,
        previousRole: targetMembership.role,
        newRole,
      },
    });

    return {
      success: true,
      membershipId: updated.id,
      userId: targetUserId,
      role: updated.role,
    };
  }

  /**
   * Remove member from workspace (immediate revocation)
   */
  async removeMember(
    workspaceId: string,
    actorId: string,
    targetUserId: string,
    meta?: RequestMeta,
  ) {
    const actorContext = await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const targetMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership || targetMembership.status !== WorkspaceMemberStatus.ACTIVE) {
      throw new NotFoundException('Member not found in workspace');
    }

    const ownerCount = await this.prisma.workspaceMember.count({
      where: {
        workspaceId,
        role: WorkspaceRole.OWNER,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    this.policyService.validateMemberRemoval(
      actorContext.role,
      targetMembership.role,
      actorId === targetUserId,
      ownerCount,
    );

    await this.prisma.workspaceMember.delete({
      where: { id: targetMembership.id },
    });

    await this.auditLogService.log({
      actorId,
      action: AuditAction.MEMBER_REMOVE,
      targetType: 'WorkspaceMember',
      targetId: targetMembership.id,
      workspaceId,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { targetUserId, removedRole: targetMembership.role },
    });

    return {
      success: true,
      message: 'Member removed successfully',
    };
  }

  /**
   * Leave workspace voluntarily
   */
  async leaveWorkspace(workspaceId: string, userId: string, meta?: RequestMeta) {
    const context = await this.policyService.getWorkspaceContext(userId, workspaceId);

    const ownerCount = await this.prisma.workspaceMember.count({
      where: {
        workspaceId,
        role: WorkspaceRole.OWNER,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    this.policyService.validateMemberRemoval(context.role, context.role, true, ownerCount);

    await this.prisma.workspaceMember.delete({
      where: { id: context.membershipId },
    });

    await this.auditLogService.log({
      actorId: userId,
      action: AuditAction.MEMBER_LEAVE,
      targetType: 'WorkspaceMember',
      targetId: context.membershipId,
      workspaceId,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      success: true,
      message: 'You have left the workspace',
    };
  }

  /**
   * Create workspace invitation
   */
  async createInvitation(
    workspaceId: string,
    actorId: string,
    dto: CreateInvitationDto,
    meta?: RequestMeta,
  ) {
    const actorContext = await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.TEAM_ADMIN,
    );

    // TEAM_ADMIN cannot invite an OWNER
    if (dto.role === WorkspaceRole.OWNER && actorContext.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only workspace owners can invite new owners');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();

    // Check if user is already a member
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email: normalizedEmail },
        status: WorkspaceMemberStatus.ACTIVE,
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already an active member of this workspace');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.workspaceInvitation.upsert({
      where: {
        workspaceId_email: {
          workspaceId,
          email: normalizedEmail,
        },
      },
      create: {
        workspaceId,
        email: normalizedEmail,
        role: dto.role,
        tokenHash,
        inviterId: actorId,
        status: 'PENDING',
        expiresAt,
      },
      update: {
        role: dto.role,
        tokenHash,
        inviterId: actorId,
        status: 'PENDING',
        expiresAt,
        acceptedAt: null,
        revokedAt: null,
      },
    });

    await this.auditLogService.log({
      actorId,
      action: AuditAction.INVITATION_CREATE,
      targetType: 'WorkspaceInvitation',
      targetId: invitation.id,
      workspaceId,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { inviteeEmail: normalizedEmail, role: dto.role },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      // Token is returned for development/testing and email dispatch
      invitationToken: rawToken,
    };
  }

  /**
   * List pending invitations in workspace
   */
  async listInvitations(workspaceId: string, userId: string) {
    await this.policyService.requireWorkspaceRole(userId, workspaceId, WorkspaceRole.TEAM_ADMIN);

    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: {
        workspaceId,
        status: 'PENDING',
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt,
      invitedBy: {
        id: inv.inviter.id,
        email: inv.inviter.email,
        name: `${inv.inviter.profile?.firstName || ''} ${inv.inviter.profile?.lastName || ''}`.trim(),
      },
      createdAt: inv.createdAt,
    }));
  }

  /**
   * Revoke invitation
   */
  async revokeInvitation(
    workspaceId: string,
    invitationId: string,
    actorId: string,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(actorId, workspaceId, WorkspaceRole.TEAM_ADMIN);

    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: { id: invitationId, workspaceId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(`Invitation is already ${invitation.status.toLowerCase()}`);
    }

    const updated = await this.prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    await this.auditLogService.log({
      actorId,
      action: AuditAction.INVITATION_REVOKE,
      targetType: 'WorkspaceInvitation',
      targetId: updated.id,
      workspaceId,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { email: updated.email },
    });

    return {
      success: true,
      message: 'Invitation revoked',
    };
  }

  /**
   * Validate workspace membership on workspace switch
   */
  async validateSwitch(workspaceId: string, userId: string) {
    const context = await this.policyService.getWorkspaceContext(userId, workspaceId);
    return {
      valid: true,
      workspaceId: context.workspaceId,
      workspaceName: context.workspaceName,
      role: context.role,
    };
  }
}
