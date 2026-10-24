import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { RequirePlatformRole, CurrentPlatformStaff, CurrentUser } from '../auth/decorators/authorization.decorators';
import { PlatformStaffRoleType, AuditAction, UserStatus, WorkspaceStatus, Prisma } from '@prisma/client';
import { PlatformStaffContext } from '../../common/policy/policy.service';
import { AuditLogService } from '../audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PolicyService } from '../../common/policy/policy.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { CreateGrantDto } from './dto/create-grant.dto';
import { ApproveGrantDto } from './dto/approve-grant.dto';
import { CreateFlagDto } from './dto/create-flag.dto';
import { AssignStaffRoleDto } from './dto/assign-staff-role.dto';
import { UpdateWorkspaceStatusDto } from './dto/update-workspace-status.dto';
import { FeatureFlagService } from './feature-flag.service';
import { EntitlementService } from './entitlement.service';
import { PrivilegedAccessGrantService } from './privileged-access.service';
import { PlatformHealthService } from './platform-health.service';

@ApiTags('Platform Staff')
@ApiBearerAuth()
@UseGuards(PlatformRolesGuard)
@Controller('platform/v1')
export class PlatformController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly policyService: PolicyService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly entitlementService: EntitlementService,
    private readonly grantService: PrivilegedAccessGrantService,
    private readonly healthService: PlatformHealthService,
  ) {}

  // ============================================
  // Staff Context & Health
  // ============================================

  @Get('me')
  @RequirePlatformRole(PlatformStaffRoleType.ANALYST)
  @ApiOperation({ summary: 'Inspect active platform staff context' })
  @ApiResponse({ status: 200, description: 'Staff credentials and role' })
  @ApiResponse({ status: 403, description: 'Forbidden - not platform staff' })
  async getStaffMe(@CurrentPlatformStaff() staff: PlatformStaffContext) {
    return staff;
  }

  @Get('health')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get platform health status' })
  @ApiResponse({ status: 200, description: 'Health status of all services' })
  async getHealth() {
    return this.healthService.getHealthStatus();
  }

  @Get('metrics')
  @RequirePlatformRole(PlatformStaffRoleType.ANALYST)
  @ApiOperation({ summary: 'Get platform aggregate metrics' })
  @ApiResponse({ status: 200, description: 'Platform-level aggregate metrics' })
  async getMetrics() {
    return this.healthService.getPlatformMetrics();
  }

  // ============================================
  // Audit Logs
  // ============================================

  @Get('audit-logs')
  @RequirePlatformRole(PlatformStaffRoleType.ANALYST)
  @ApiOperation({ summary: 'Query global platform audit logs' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'actorId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'targetType', required: false })
  @ApiQuery({ name: 'grantId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Filtered audit logs' })
  async getAuditLogs(@Query() query: any) {
    const filters = {
      workspaceId: query.workspaceId,
      actorId: query.actorId,
      action: query.action,
      targetType: query.targetType,
      grantId: query.grantId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit ? parseInt(query.limit) : 50,
      offset: query.offset ? parseInt(query.offset) : 0,
    };
    return this.auditLogService.findLogs(filters);
  }

  @Get('audit/integrity')
  @RequirePlatformRole(PlatformStaffRoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Verify audit log chain integrity' })
  @ApiResponse({ status: 200, description: 'Integrity verification result' })
  async verifyAuditIntegrity() {
    return this.auditLogService.verifyIntegrity();
  }

  // ============================================
  // User Administration
  // ============================================

  @Get('users')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User list' })
  async listUsers(@Query() query: any) {
    const where: any = {};
    if (query.status) where.status = query.status;

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        take: Math.min(query.limit || 50, 100),
        skip: query.offset || 0,
        select: {
          id: true,
          email: true,
          status: true,
          isEmailVerified: true,
          createdAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, users, limit: query.limit || 50, offset: query.offset || 0 };
  }

  @Post('users/:targetUserId/status')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Change user account status with mandatory reason' })
  @ApiParam({ name: 'targetUserId', description: 'Target user UUID' })
  @ApiResponse({ status: 200, description: 'User status updated and audited' })
  async updateUserStatus(
    @Param('targetUserId') targetUserId: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: dto.status as UserStatus },
    });

    const requestId = req.correlationId || (req.headers['x-request-id'] as string);

    await this.auditLogService.log({
      actorId,
      action: AuditAction.PLATFORM_STAFF_ROLE_UPDATE,
      targetType: 'User',
      targetId: targetUserId,
      requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        newStatus: dto.status,
        reason: dto.reason,
      },
      actorType: 'PLATFORM_STAFF',
    });

    return {
      success: true,
      userId: updated.id,
      status: updated.status,
      reason: dto.reason,
    };
  }

  // ============================================
  // Workspace Administration
  // ============================================

  @Get('workspaces')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List all workspaces' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Workspace list' })
  async listWorkspaces(@Query() query: any) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

    const [total, workspaces] = await Promise.all([
      this.prisma.workspace.count({ where }),
      this.prisma.workspace.findMany({
        where,
        take: Math.min(query.limit || 50, 100),
        skip: query.offset || 0,
        include: {
          owner: {
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
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, workspaces, limit: query.limit || 50, offset: query.offset || 0 };
  }

  @Post('workspaces/:workspaceId/status')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Change workspace status with mandatory reason' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace status updated and audited' })
  async updateWorkspaceStatus(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceStatusDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const updated = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { status: dto.status as WorkspaceStatus },
    });

    const requestId = req.correlationId || (req.headers['x-request-id'] as string);

    await this.auditLogService.log({
      actorId,
      action: AuditAction.WORKSPACE_UPDATE,
      targetType: 'Workspace',
      targetId: workspaceId,
      workspaceId,
      requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        newStatus: dto.status,
        reason: dto.reason,
      },
      actorType: 'PLATFORM_STAFF',
    });

    return {
      success: true,
      workspaceId: updated.id,
      status: updated.status,
      reason: dto.reason,
    };
  }

  // ============================================
  // Staff Role Management
  // ============================================

  @Get('staff-roles')
  @RequirePlatformRole(PlatformStaffRoleType.SUPERADMIN)
  @ApiOperation({ summary: 'List all platform staff roles' })
  @ApiResponse({ status: 200, description: 'Staff role list' })
  async listStaffRoles() {
    return this.prisma.platformStaffRole.findMany({
      include: {
        user: {
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
  }

  @Post('staff-roles')
  @RequirePlatformRole(PlatformStaffRoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Assign platform staff role' })
  @ApiResponse({ status: 200, description: 'Role assigned and audited' })
  async assignStaffRole(
    @Body() dto: AssignStaffRoleDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    await this.policyService.validatePlatformRoleChange(actorId, dto.userId, dto.role, 'grant');

    const staffRole = await this.prisma.platformStaffRole.create({
      data: {
        userId: dto.userId,
        role: dto.role,
        status: 'ACTIVE',
        grantedBy: actorId,
        reason: dto.reason,
      },
    });

    const requestId = req.correlationId || (req.headers['x-request-id'] as string);

    await this.auditLogService.log({
      actorId,
      action: AuditAction.PLATFORM_STAFF_ROLE_CREATE,
      targetType: 'PlatformStaffRole',
      targetId: staffRole.id,
      requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        targetUserId: dto.userId,
        newRole: dto.role,
        reason: dto.reason,
      },
      actorType: 'PLATFORM_STAFF',
    });

    return staffRole;
  }

  @Delete('staff-roles/:roleId')
  @RequirePlatformRole(PlatformStaffRoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Revoke platform staff role' })
  @ApiParam({ name: 'roleId', description: 'Staff role UUID' })
  @ApiResponse({ status: 200, description: 'Role revoked and audited' })
  async revokeStaffRole(
    @Param('roleId') roleId: string,
    @Body('reason') reason: string,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const existing = await this.prisma.platformStaffRole.findUnique({
      where: { id: roleId },
    });

    if (!existing) {
      throw new Error('Staff role not found');
    }

    await this.policyService.validatePlatformRoleChange(actorId, existing.userId, existing.role, 'revoke');

    const updated = await this.prisma.platformStaffRole.update({
      where: { id: roleId },
      data: {
        status: 'INACTIVE',
        revokedAt: new Date(),
        reason,
      },
    });

    const requestId = req.correlationId || (req.headers['x-request-id'] as string);

    await this.auditLogService.log({
      actorId,
      action: AuditAction.PLATFORM_STAFF_ROLE_REVOKE,
      targetType: 'PlatformStaffRole',
      targetId: roleId,
      requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        targetUserId: existing.userId,
        revokedRole: existing.role,
        reason,
      },
      actorType: 'PLATFORM_STAFF',
    });

    return updated;
  }

  // ============================================
  // Feature Flags
  // ============================================

  @Get('feature-flags')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List all feature flags' })
  @ApiResponse({ status: 200, description: 'Feature flag list' })
  async listFeatureFlags() {
    return this.featureFlagService.listFlags();
  }

  @Get('feature-flags/:key')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get feature flag by key' })
  @ApiParam({ name: 'key', description: 'Flag key' })
  @ApiResponse({ status: 200, description: 'Feature flag details' })
  async getFeatureFlag(@Param('key') key: string) {
    return this.featureFlagService.getFlag(key);
  }

  @Post('feature-flags')
  @RequirePlatformRole(PlatformStaffRoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Create or update feature flag' })
  @ApiResponse({ status: 200, description: 'Flag created/updated and audited' })
  async upsertFeatureFlag(
    @Body() dto: CreateFlagDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const flag = await this.featureFlagService.upsertFlag(
      dto.key,
      {
        description: dto.description,
        type: dto.type,
        defaultValue: dto.defaultValue,
        rules: dto.rules as Prisma.JsonObject,
        status: dto.status,
      },
      actorId,
      dto.reason,
    );

    const requestId = req.correlationId || (req.headers['x-request-id'] as string);

    await this.auditLogService.log({
      actorId,
      action: AuditAction.WORKSPACE_SETTINGS_UPDATE,
      targetType: 'FeatureFlag',
      targetId: flag.id,
      requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        flagKey: dto.key,
        status: dto.status,
        reason: dto.reason,
      },
      actorType: 'PLATFORM_STAFF',
    });

    return flag;
  }

  @Get('feature-flags/evaluate')
  @RequirePlatformRole(PlatformStaffRoleType.ANALYST)
  @ApiOperation({ summary: 'Evaluate a feature flag' })
  @ApiQuery({ name: 'key', description: 'Flag key' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'planId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiResponse({ status: 200, description: 'Flag evaluation result' })
  async evaluateFlag(@Query() query: any) {
    return this.featureFlagService.evaluate(query.key, {
      workspaceId: query.workspaceId,
      planId: query.planId,
      userId: query.userId,
    });
  }

  // ============================================
  // Plans & Entitlements
  // ============================================

  @Get('plans')
  @RequirePlatformRole(PlatformStaffRoleType.SUPERADMIN)
  @ApiOperation({ summary: 'List all plans' })
  @ApiResponse({ status: 200, description: 'Plan list' })
  async listPlans() {
    return this.entitlementService.listPlans();
  }

  @Get('plans/:key')
  @RequirePlatformRole(PlatformStaffRoleType.SUPERADMIN)
  @ApiOperation({ summary: 'Get plan by key' })
  @ApiParam({ name: 'key', description: 'Plan key' })
  @ApiResponse({ status: 200, description: 'Plan details' })
  async getPlan(@Param('key') key: string) {
    return this.entitlementService.getPlan(key);
  }

  // ============================================
  // Privileged Access Grants
  // ============================================

  @Get('grants')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List privileged access grants' })
  @ApiQuery({ name: 'requesterId', required: false })
  @ApiQuery({ name: 'targetWorkspaceId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Grant list' })
  async listGrants(@Query() query: any) {
    return this.grantService.listGrants(query);
  }

  @Get('grants/:grantId')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get grant details' })
  @ApiParam({ name: 'grantId', description: 'Grant UUID' })
  @ApiResponse({ status: 200, description: 'Grant details' })
  async getGrant(@Param('grantId') grantId: string) {
    return this.grantService.getGrant(grantId);
  }

  @Post('grants')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Request privileged access grant' })
  @ApiResponse({ status: 200, description: 'Grant created' })
  async requestGrant(
    @Body() dto: CreateGrantDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const grant = await this.grantService.requestGrant({
      requesterId: actorId,
      targetWorkspaceId: dto.targetWorkspaceId,
      reason: dto.reason,
      scope: dto.scope,
      expiresAt,
    });

    const requestId = req.correlationId || (req.headers['x-request-id'] as string);

    await this.auditLogService.log({
      actorId,
      action: AuditAction.PLATFORM_SUPPORT_ACCESS,
      targetType: 'PrivilegedAccessGrant',
      targetId: grant.id,
      workspaceId: dto.targetWorkspaceId,
      requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        scope: dto.scope,
        reason: dto.reason,
        expiresAt: expiresAt.toISOString(),
      },
      actorType: 'PLATFORM_STAFF',
      grantId: grant.id,
    });

    return grant;
  }

  @Post('grants/:grantId/approve')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Approve pending grant' })
  @ApiParam({ name: 'grantId', description: 'Grant UUID' })
  @ApiResponse({ status: 200, description: 'Grant approved' })
  async approveGrant(
    @Param('grantId') grantId: string,
    @Body() dto: ApproveGrantDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const grant = await this.grantService.approveGrant({ grantId, approverId: actorId });

    const requestId = req.correlationId || (req.headers['x-request-id'] as string);

    await this.auditLogService.log({
      actorId,
      action: AuditAction.PLATFORM_SUPPORT_ACCESS,
      targetType: 'PrivilegedAccessGrant',
      targetId: grantId,
      requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        action: 'approve',
        reason: dto.reason,
      },
      actorType: 'PLATFORM_STAFF',
      grantId,
    });

    return grant;
  }

  @Post('grants/:grantId/revoke')
  @HttpCode(200)
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Revoke active grant' })
  @ApiParam({ name: 'grantId', description: 'Grant UUID' })
  @ApiResponse({ status: 200, description: 'Grant revoked' })
  async revokeGrant(
    @Param('grantId') grantId: string,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const grant = await this.grantService.revokeGrant(grantId, actorId);

    const requestId = req.correlationId || (req.headers['x-request-id'] as string);

    await this.auditLogService.log({
      actorId,
      action: AuditAction.PLATFORM_SUPPORT_ACCESS,
      targetType: 'PrivilegedAccessGrant',
      targetId: grantId,
      requestId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        action: 'revoke',
      },
      actorType: 'PLATFORM_STAFF',
      grantId,
    });

    return grant;
  }
}
