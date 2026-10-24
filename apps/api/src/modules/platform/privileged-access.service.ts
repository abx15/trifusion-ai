import { Injectable, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlatformStaffRoleType } from '@prisma/client';

export interface CreateGrantOptions {
  requesterId: string;
  targetWorkspaceId: string;
  reason: string;
  scope: string;
  expiresAt: Date;
}

export interface ApproveGrantOptions {
  grantId: string;
  approverId: string;
}

const MAX_GRANT_DURATION_HOURS = 168; // 7 days

@Injectable()
export class PrivilegedAccessGrantService {
  private readonly logger = new Logger(PrivilegedAccessGrantService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Request a privileged access grant
   */
  async requestGrant(options: CreateGrantOptions): Promise<any> {
    const { requesterId, targetWorkspaceId, reason, scope, expiresAt } = options;

    // Validate requester has platform staff role
    const requesterRole = await this.prisma.platformStaffRole.findFirst({
      where: { userId: requesterId, status: 'ACTIVE' },
    });

    if (!requesterRole) {
      throw new ForbiddenException('Only platform staff can request privileged access grants');
    }

    // Validate target workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
    });

    if (!workspace) {
      throw new BadRequestException('Target workspace not found');
    }

    // Validate expiry time
    const maxExpiry = new Date(Date.now() + MAX_GRANT_DURATION_HOURS * 60 * 60 * 1000);
    if (expiresAt > maxExpiry) {
      throw new BadRequestException(`Grant expiry cannot exceed ${MAX_GRANT_DURATION_HOURS} hours`);
    }

    // Check for existing active grant
    const existingGrant = await this.prisma.privilegedAccessGrant.findFirst({
      where: {
        requesterId,
        targetWorkspaceId,
        status: { in: ['PENDING', 'ACTIVE'] },
        expiresAt: { gte: new Date() },
      },
    });

    if (existingGrant) {
      throw new BadRequestException('An active or pending grant already exists for this workspace');
    }

    // Determine if auto-approval is allowed (low-scope grants)
    const autoApprove = this.shouldAutoApprove(scope, requesterRole.role);

    const grant = await this.prisma.privilegedAccessGrant.create({
      data: {
        requesterId,
        targetWorkspaceId,
        reason,
        scope,
        status: autoApprove ? 'ACTIVE' : 'PENDING',
        approverId: autoApprove ? requesterId : null,
        startsAt: new Date(),
        expiresAt,
      },
    });

    this.logger.log(
      `Privileged access grant ${grant.id} ${autoApprove ? 'auto-approved' : 'requested'} by ${requesterId} for workspace ${targetWorkspaceId}`,
    );

    return grant;
  }

  /**
   * Approve a pending grant
   */
  async approveGrant(options: ApproveGrantOptions): Promise<any> {
    const { grantId, approverId } = options;

    const grant = await this.prisma.privilegedAccessGrant.findUnique({
      where: { id: grantId },
      include: { requester: true },
    });

    if (!grant) {
      throw new BadRequestException('Grant not found');
    }

    if (grant.status !== 'PENDING') {
      throw new BadRequestException('Grant is not in pending status');
    }

    // Validate approver has sufficient platform role
    const approverRole = await this.prisma.platformStaffRole.findFirst({
      where: { userId: approverId, status: 'ACTIVE' },
    });

    if (!approverRole) {
      throw new ForbiddenException('Only platform staff can approve grants');
    }

    // Prevent self-approval for high-scope grants
    if (grant.requesterId === approverId && !this.shouldAutoApprove(grant.scope, approverRole.role)) {
      throw new ForbiddenException('Cannot approve your own high-scope grant');
    }

    const updated = await this.prisma.privilegedAccessGrant.update({
      where: { id: grantId },
      data: {
        status: 'ACTIVE',
        approverId,
        startsAt: new Date(),
      },
    });

    this.logger.log(`Privileged access grant ${grantId} approved by ${approverId}`);

    return updated;
  }

  /**
   * Revoke a grant
   */
  async revokeGrant(grantId: string, revokerId: string): Promise<any> {
    const grant = await this.prisma.privilegedAccessGrant.findUnique({
      where: { id: grantId },
    });

    if (!grant) {
      throw new BadRequestException('Grant not found');
    }

    if (grant.status === 'REVOKED' || grant.status === 'EXPIRED') {
      throw new BadRequestException('Grant is already revoked or expired');
    }

    // Validate revoker has sufficient platform role
    const revokerRole = await this.prisma.platformStaffRole.findFirst({
      where: { userId: revokerId, status: 'ACTIVE' },
    });

    if (!revokerRole) {
      throw new ForbiddenException('Only platform staff can revoke grants');
    }

    const updated = await this.prisma.privilegedAccessGrant.update({
      where: { id: grantId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    this.logger.log(`Privileged access grant ${grantId} revoked by ${revokerId}`);

    return updated;
  }

  /**
   * Validate a grant is active and not expired
   */
  async validateGrant(grantId: string): Promise<boolean> {
    const grant = await this.prisma.privilegedAccessGrant.findUnique({
      where: { id: grantId },
    });

    if (!grant) {
      return false;
    }

    if (grant.status !== 'ACTIVE') {
      return false;
    }

    if (new Date() > grant.expiresAt) {
      // Auto-expire
      await this.prisma.privilegedAccessGrant.update({
        where: { id: grantId },
        data: { status: 'EXPIRED' },
      });
      return false;
    }

    if (grant.revokedAt) {
      return false;
    }

    return true;
  }

  /**
   * Get grant details
   */
  async getGrant(grantId: string) {
    return this.prisma.privilegedAccessGrant.findUnique({
      where: { id: grantId },
      include: {
        requester: {
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
        targetWorkspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * List grants with filters
   */
  async listGrants(filters: {
    requesterId?: string;
    targetWorkspaceId?: string;
    status?: string;
  }) {
    const where: any = {};
    if (filters.requesterId) where.requesterId = filters.requesterId;
    if (filters.targetWorkspaceId) where.targetWorkspaceId = filters.targetWorkspaceId;
    if (filters.status) where.status = filters.status;

    return this.prisma.privilegedAccessGrant.findMany({
      where,
      include: {
        requester: {
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
        targetWorkspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Determine if grant should be auto-approved
   * Low-scope grants (read-only aggregates) can be auto-approved
   * High-scope grants (full access) require two-person approval
   */
  private shouldAutoApprove(scope: string, role: PlatformStaffRoleType): boolean {
    const lowScopes = ['read:aggregate', 'read:metrics', 'read:audit'];
    const isLowScope = lowScopes.some((s) => scope.includes(s));

    // SUPERADMIN can auto-approve low-scope grants
    if (role === PlatformStaffRoleType.SUPERADMIN && isLowScope) {
      return true;
    }

    // PLATFORM_ADMIN can auto-approve very low-scope grants
    if (role === PlatformStaffRoleType.PLATFORM_ADMIN && scope === 'read:aggregate') {
      return true;
    }

    return false;
  }

  /**
   * Clean up expired grants (scheduled job)
   */
  async cleanupExpiredGrants(): Promise<number> {
    const result = await this.prisma.privilegedAccessGrant.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired grants`);
    }

    return result.count;
  }
}
