import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RequireWorkspaceRole } from '../auth/decorators/authorization.decorators';
import { WorkspaceRole } from '@prisma/client';
import { AuditLogService } from '../audit/audit.service';

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller({ path: 'workspaces', version: '1' })
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private extractMeta(req: Request) {
    return {
      ip: req.ip || (req.headers['x-forwarded-for'] as string),
      userAgent: req.headers['user-agent'],
      requestId: req.correlationId || (req.headers['x-request-id'] as string),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new company workspace' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully' })
  async createWorkspace(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWorkspaceDto,
    @Req() req: Request,
  ) {
    return this.workspacesService.createWorkspace(userId, dto, this.extractMeta(req));
  }

  @Get()
  @ApiOperation({ summary: 'List all workspaces accessible to the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of workspaces with assigned roles' })
  async listUserWorkspaces(@CurrentUser('id') userId: string) {
    return this.workspacesService.listUserWorkspaces(userId);
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'Get workspace details' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace details' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a member' })
  async getWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.getWorkspace(workspaceId, userId);
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Update workspace settings' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires TEAM_ADMIN or OWNER' })
  async updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWorkspaceDto,
    @Req() req: Request,
  ) {
    return this.workspacesService.updateWorkspace(workspaceId, userId, dto, this.extractMeta(req));
  }

  @Get(':workspaceId/validate')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'Validate workspace membership on workspace switch' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace context is valid' })
  @ApiResponse({ status: 403, description: 'User does not belong to target workspace' })
  async validateSwitch(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.validateSwitch(workspaceId, userId);
  }

  // ============================================
  // WORKSPACE MEMBERS
  // ============================================

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceGuard)
  @ApiOperation({ summary: 'List all active members in workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Members list with roles' })
  async listMembers(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.listMembers(workspaceId, userId);
  }

  @Patch(':workspaceId/members/:targetUserId/role')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Update member role (escalation rules strictly enforced)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'targetUserId', description: 'Target user UUID' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Escalation blocked' })
  async updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('targetUserId') targetUserId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Req() req: Request,
  ) {
    return this.workspacesService.updateMemberRole(
      workspaceId,
      actorId,
      targetUserId,
      dto.role,
      this.extractMeta(req),
    );
  }

  @Delete(':workspaceId/members/:targetUserId')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Remove member from workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'targetUserId', description: 'Target user UUID' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('targetUserId') targetUserId: string,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    return this.workspacesService.removeMember(
      workspaceId,
      actorId,
      targetUserId,
      this.extractMeta(req),
    );
  }

  @Post(':workspaceId/leave')
  @UseGuards(WorkspaceGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave workspace voluntarily' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Left workspace successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - sole owner cannot leave' })
  async leaveWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    return this.workspacesService.leaveWorkspace(workspaceId, userId, this.extractMeta(req));
  }

  // ============================================
  // WORKSPACE INVITATIONS
  // ============================================

  @Post(':workspaceId/invitations')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Invite a new member to the workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  @ApiResponse({ status: 409, description: 'User already in workspace' })
  async createInvitation(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateInvitationDto,
    @Req() req: Request,
  ) {
    return this.workspacesService.createInvitation(workspaceId, actorId, dto, this.extractMeta(req));
  }

  @Get(':workspaceId/invitations')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'List pending invitations' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Pending invitations' })
  async listInvitations(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workspacesService.listInvitations(workspaceId, userId);
  }

  @Delete(':workspaceId/invitations/:invitationId')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiParam({ name: 'invitationId', description: 'Invitation UUID' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  async revokeInvitation(
    @Param('workspaceId') workspaceId: string,
    @Param('invitationId') invitationId: string,
    @CurrentUser('id') actorId: string,
    @Req() req: Request,
  ) {
    return this.workspacesService.revokeInvitation(
      workspaceId,
      invitationId,
      actorId,
      this.extractMeta(req),
    );
  }

  // ============================================
  // WORKSPACE AUDIT LOGS
  // ============================================

  @Get(':workspaceId/audit-logs')
  @UseGuards(WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'View audit logs for this workspace (TEAM_ADMIN/OWNER only)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Workspace audit log stream' })
  async getWorkspaceAuditLogs(@Param('workspaceId') workspaceId: string) {
    return this.auditLogService.findLogs({ workspaceId });
  }
}
