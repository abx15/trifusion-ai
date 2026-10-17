import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { RequirePlatformRole, CurrentPlatformStaff, CurrentUser } from '../auth/decorators/authorization.decorators';
import { PlatformStaffRoleType, AuditAction } from '@prisma/client';
import { PlatformStaffContext } from '../../common/policy/policy.service';
import { AuditLogService } from '../audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@ApiTags('Platform Staff')
@ApiBearerAuth()
@UseGuards(PlatformRolesGuard)
@Controller({ path: 'platform/staff', version: '1' })
export class PlatformController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get('me')
  @RequirePlatformRole(PlatformStaffRoleType.ANALYST)
  @ApiOperation({ summary: 'Inspect active platform staff context' })
  @ApiResponse({ status: 200, description: 'Staff credentials and role' })
  @ApiResponse({ status: 403, description: 'Forbidden - not platform staff' })
  async getStaffMe(@CurrentPlatformStaff() staff: PlatformStaffContext) {
    return staff;
  }

  @Get('audit-logs')
  @RequirePlatformRole(PlatformStaffRoleType.ANALYST)
  @ApiOperation({ summary: 'Query global platform audit logs (Staff only)' })
  @ApiResponse({ status: 200, description: 'Global audit logs stream' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Platform Staff role' })
  async getGlobalAuditLogs() {
    return this.auditLogService.findLogs({});
  }

  @Post('users/:targetUserId/status')
  @RequirePlatformRole(PlatformStaffRoleType.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Admin action: change user account status with mandatory reason' })
  @ApiParam({ name: 'targetUserId', description: 'Target user UUID' })
  @ApiResponse({ status: 200, description: 'User status updated and audited' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires PLATFORM_ADMIN or SUPERADMIN' })
  async updateUserStatus(
    @Param('targetUserId') targetUserId: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: dto.status },
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
    });

    return {
      success: true,
      userId: updated.id,
      status: updated.status,
      reason: dto.reason,
    };
  }
}
