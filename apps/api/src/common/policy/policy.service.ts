import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  WorkspaceRole,
  UserStatus,
  PlatformStaffRoleType,
  WorkspaceMemberStatus,
  WorkspaceStatus,
} from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  status: UserStatus;
}

export interface WorkspaceContext {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
  membershipId: string;
}

export interface PlatformStaffContext {
  id: string;
  role: PlatformStaffRoleType;
}

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  TEAM_ADMIN: 3,
  OWNER: 4,
};

export const PLATFORM_ROLE_HIERARCHY: Record<PlatformStaffRoleType, number> = {
  ANALYST: 1,
  SUPPORT_AGENT: 2,
  PLATFORM_ADMIN: 3,
  SUPERADMIN: 4,
};

@Injectable()
export class PolicyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves user and asserts that the user is currently ACTIVE.
   * Inactive, suspended, or deleted users are rejected.
   */
  async resolveUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, status: true },
    });

    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}. Access denied.`);
    }

    return user;
  }

  /**
   * Server-side workspace context resolution.
   * Checks both workspace active status and active membership.
   */
  async getWorkspaceContext(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceContext> {
    if (!workspaceId) {
      throw new BadRequestException('Workspace ID is required');
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!membership || membership.status !== WorkspaceMemberStatus.ACTIVE) {
      throw new ForbiddenException('You do not have active access to this workspace');
    }

    if (membership.workspace.status !== WorkspaceStatus.ACTIVE) {
      throw new ForbiddenException('Workspace is currently suspended or archived');
    }

    return {
      workspaceId: membership.workspaceId,
      workspaceName: membership.workspace.name,
      role: membership.role,
      membershipId: membership.id,
    };
  }

  /**
   * Asserts that the authenticated user possesses at least the required workspace role.
   */
  async requireWorkspaceRole(
    userId: string,
    workspaceId: string,
    requiredRole: WorkspaceRole,
  ): Promise<WorkspaceContext> {
    const context = await this.getWorkspaceContext(userId, workspaceId);

    if (ROLE_HIERARCHY[context.role] < ROLE_HIERARCHY[requiredRole]) {
      throw new ForbiddenException(
        `Insufficient permissions in workspace. Required: ${requiredRole}, Current: ${context.role}`,
      );
    }

    return context;
  }

  /**
   * Resolves platform staff role and verifies active status.
   */
  async getPlatformStaffContext(userId: string): Promise<PlatformStaffContext | null> {
    const staffRole = await this.prisma.platformStaffRole.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!staffRole) {
      return null;
    }

    return { id: staffRole.id, role: staffRole.role };
  }

  /**
   * Asserts platform staff role. Customer roles cannot access platform routes.
   */
  async requirePlatformRole(
    userId: string,
    requiredRole: PlatformStaffRoleType,
  ): Promise<PlatformStaffContext> {
    const staffContext = await this.getPlatformStaffContext(userId);

    if (!staffContext) {
      throw new ForbiddenException('Platform staff access required');
    }

    if (PLATFORM_ROLE_HIERARCHY[staffContext.role] < PLATFORM_ROLE_HIERARCHY[requiredRole]) {
      throw new ForbiddenException(
        `Insufficient platform privileges. Required: ${requiredRole}, Current: ${staffContext.role}`,
      );
    }

    return staffContext;
  }

  /**
   * Strict validation for role change operations to prevent privilege escalation:
   * 1. Users cannot change their own role (no self-promotion or accidental self-demotion without checks).
   * 2. Only an OWNER can promote someone to OWNER.
   * 3. TEAM_ADMIN cannot touch another TEAM_ADMIN or an OWNER.
   * 4. Last remaining OWNER cannot be demoted.
   */
  validateRoleChange(
    actorRole: WorkspaceRole,
    targetCurrentRole: WorkspaceRole,
    newRole: WorkspaceRole,
    isSelf: boolean,
    activeOwnerCount: number,
  ): void {
    if (isSelf) {
      throw new ForbiddenException('You cannot modify your own workspace role');
    }

    if (actorRole !== 'OWNER' && actorRole !== 'TEAM_ADMIN') {
      throw new ForbiddenException('Only owners and team admins can modify member roles');
    }

    // Attempting to grant OWNER role
    if (newRole === 'OWNER' && actorRole !== 'OWNER') {
      throw new ForbiddenException('Only a workspace owner can promote a member to OWNER');
    }

    // Modifying an OWNER
    if (targetCurrentRole === 'OWNER') {
      if (actorRole !== 'OWNER') {
        throw new ForbiddenException('Team admins cannot modify an OWNER role');
      }
      if (newRole !== 'OWNER' && activeOwnerCount <= 1) {
        throw new BadRequestException('Cannot demote the last remaining OWNER of the workspace');
      }
    }

    // Modifying another TEAM_ADMIN
    if (targetCurrentRole === 'TEAM_ADMIN' && actorRole !== 'OWNER') {
      throw new ForbiddenException('Team admins cannot modify another TEAM_ADMIN role');
    }
  }

  /**
   * Strict validation for member removal or leaving:
   * 1. The last remaining OWNER cannot be removed or leave the workspace.
   * 2. TEAM_ADMIN cannot remove an OWNER or another TEAM_ADMIN.
   * 3. Regular MEMBER/VIEWER cannot remove anyone except leaving voluntarily.
   */
  validateMemberRemoval(
    actorRole: WorkspaceRole,
    targetRole: WorkspaceRole,
    isSelf: boolean,
    activeOwnerCount: number,
  ): void {
    if (targetRole === 'OWNER' && activeOwnerCount <= 1) {
      throw new BadRequestException(
        isSelf
          ? 'You are the sole owner of this workspace. You must transfer ownership before leaving.'
          : 'Cannot remove the last remaining owner of the workspace.',
      );
    }

    if (isSelf) {
      // Voluntary departure is allowed as long as last owner rule was passed above
      return;
    }

    // Removing another member
    if (actorRole === 'MEMBER' || actorRole === 'VIEWER') {
      throw new ForbiddenException('Members and viewers cannot remove other users');
    }

    if (actorRole === 'TEAM_ADMIN') {
      if (targetRole === 'OWNER' || targetRole === 'TEAM_ADMIN') {
        throw new ForbiddenException('Team admins cannot remove owners or other team admins');
      }
    }
  }

  /**
   * Lists workspaces for a given user.
   */
  async listUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId,
        status: WorkspaceMemberStatus.ACTIVE,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      type: m.workspace.type,
      status: m.workspace.status,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }
}