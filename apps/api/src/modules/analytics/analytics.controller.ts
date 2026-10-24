import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformStaffRoleType, WorkspaceRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { CurrentUser, RequirePlatformRole, RequireWorkspaceRole } from '../auth/decorators/authorization.decorators';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'workspaces/:workspaceId/analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.VIEWER)
  @ApiOperation({ summary: 'Return the workspace analytics overview' })
  async getWorkspaceOverview(
    @CurrentUser('id') actorId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
    @Query('projectStatus') projectStatus?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('taskStatus') taskStatus?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getWorkspaceOverview(workspaceId, actorId, {
      projectId,
      projectStatus: projectStatus as any,
      assigneeId,
      taskStatus: taskStatus as any,
      startDate,
      endDate,
    });
  }

  @Get('tasks')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.VIEWER)
  async getTaskAnalytics(
    @CurrentUser('id') actorId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
    @Query('projectStatus') projectStatus?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('taskStatus') taskStatus?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getTaskAnalytics(workspaceId, actorId, {
      projectId,
      projectStatus: projectStatus as any,
      assigneeId,
      taskStatus: taskStatus as any,
      startDate,
      endDate,
    });
  }

  @Get('projects')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.VIEWER)
  async getProjectAnalytics(
    @CurrentUser('id') actorId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
    @Query('projectStatus') projectStatus?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getProjectAnalytics(workspaceId, actorId, {
      projectId,
      projectStatus: projectStatus as any,
      startDate,
      endDate,
    });
  }

  @Get('team-workload')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.VIEWER)
  async getTeamWorkload(
    @CurrentUser('id') actorId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
    @Query('taskStatus') taskStatus?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getTeamWorkload(workspaceId, actorId, {
      projectId,
      assigneeId,
      taskStatus: taskStatus as any,
      startDate,
      endDate,
    });
  }

  @Get('client-activity')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.VIEWER)
  async getClientActivity(
    @CurrentUser('id') actorId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getClientActivity(workspaceId, actorId, { startDate, endDate });
  }

  @Get('trends')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.VIEWER)
  async getTrendMetrics(
    @CurrentUser('id') actorId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
    @Query('projectStatus') projectStatus?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('taskStatus') taskStatus?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getTrendMetrics(workspaceId, actorId, {
      projectId,
      projectStatus: projectStatus as any,
      assigneeId,
      taskStatus: taskStatus as any,
      startDate,
      endDate,
    });
  }
}

@ApiTags('Platform Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@Controller('platform/v1/analytics')
export class PlatformAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @RequirePlatformRole(PlatformStaffRoleType.ANALYST)
  async getPlatformOverview(@CurrentUser('id') actorId: string) {
    return this.analyticsService.getPlatformAnalytics(actorId, PlatformStaffRoleType.ANALYST);
  }
}
