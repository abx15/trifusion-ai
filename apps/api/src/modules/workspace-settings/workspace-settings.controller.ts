import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RequireWorkspaceRole } from '../auth/decorators/authorization.decorators';
import { CurrentUser, CurrentWorkspace } from '../auth/decorators/authorization.decorators';
import { WorkspaceSettingsService } from './workspace-settings.service';
import { UpdateWorkspaceSettingsDto } from './dto/update-workspace-settings.dto';
import { WorkspaceRole } from '@prisma/client';
import { WorkspaceSettingsEntity } from './entities/workspace-settings.entity';

@ApiTags('Workspace Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller({ path: 'workspaces/:workspaceId/settings', version: '1' })
export class WorkspaceSettingsController {
  constructor(private readonly workspaceSettingsService: WorkspaceSettingsService) {}

  private extractMeta(req: Request) {
    return {
      ip: req.ip || (req.headers['x-forwarded-for'] as string),
      userAgent: req.headers['user-agent'],
      requestId: req.correlationId || (req.headers['x-request-id'] as string),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get workspace settings' })
  @ApiResponse({
    status: 200,
    description: 'Workspace settings, or null until first saved',
    type: WorkspaceSettingsEntity,
  })
  async getSettings(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.workspaceSettingsService.getSettings(workspaceId, actorId);
  }

  @Patch()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Update workspace settings' })
  @ApiResponse({
    status: 200,
    description: 'Workspace settings updated',
    type: WorkspaceSettingsEntity,
  })
  async updateSettings(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: UpdateWorkspaceSettingsDto,
    @Req() req: Request,
  ) {
    return this.workspaceSettingsService.updateSettings(workspaceId, actorId, dto, this.extractMeta(req));
  }
}
