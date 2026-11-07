import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import {
  RequireWorkspaceRole,
  RequirePlatformRole,
  RequirePlatformRoles,
  CurrentUser,
  CurrentWorkspace,
} from '../auth/decorators/authorization.decorators';
import { SupportService } from './support.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  UpdateTicketStatusDto,
  CreateSessionDto,
} from './dto/support.dto';
import { WorkspaceRole, PlatformStaffRoleType } from '@prisma/client';
import { RequestMeta } from '../auth/auth.service';

@ApiTags('Support')
@ApiBearerAuth()
@Controller({ path: 'workspaces/:workspaceId/support', version: '1' })
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  private extractMeta(req: Request): RequestMeta {
    return {
      ip: req.ip || (req.headers['x-forwarded-for'] as string),
      userAgent: req.headers['user-agent'],
      requestId: req.correlationId || (req.headers['x-request-id'] as string),
    };
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @ApiOperation({ summary: 'List support tickets for a workspace' })
  async listTickets(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Query() filters: { status?: string; priority?: string; assigneeId?: string; limit?: number; cursor?: string },
  ) {
    return this.supportService.listTickets(workspaceId, actorId, filters);
  }

  @Post('tickets')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a support ticket' })
  async createTicket(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateTicketDto,
    @Req() req: Request,
  ) {
    return this.supportService.createTicket(workspaceId, actorId, dto, this.extractMeta(req));
  }

  @Get('tickets/:ticketId')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @ApiOperation({ summary: 'Get a support ticket by ID' })
  @ApiParam({ name: 'ticketId', description: 'Ticket UUID' })
  async getTicket(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('ticketId') ticketId: string,
  ) {
    return this.supportService.getTicket(workspaceId, ticketId, actorId);
  }

  @Patch('tickets/:ticketId')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @ApiOperation({ summary: 'Update a support ticket' })
  @ApiParam({ name: 'ticketId', description: 'Ticket UUID' })
  async updateTicket(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateTicketDto,
    @Req() req: Request,
  ) {
    return this.supportService.updateTicket(workspaceId, ticketId, actorId, dto, this.extractMeta(req));
  }

  @Patch('tickets/:ticketId/status')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @ApiOperation({ summary: 'Update support ticket status' })
  @ApiParam({ name: 'ticketId', description: 'Ticket UUID' })
  async updateTicketStatus(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateTicketStatusDto,
    @Req() req: Request,
  ) {
    return this.supportService.updateTicketStatus(workspaceId, ticketId, actorId, dto, this.extractMeta(req));
  }

  @Patch('tickets/:ticketId/assign')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Assign a support ticket to a member' })
  @ApiParam({ name: 'ticketId', description: 'Ticket UUID' })
  async assignTicket(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('ticketId') ticketId: string,
    @Body('assigneeId') assigneeId: string,
    @Req() req: Request,
  ) {
    return this.supportService.assignTicket(workspaceId, ticketId, actorId, assigneeId, this.extractMeta(req));
  }

  @Delete('tickets/:ticketId/archive')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Archive (close) a support ticket' })
  @ApiParam({ name: 'ticketId', description: 'Ticket UUID' })
  async archiveTicket(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('ticketId') ticketId: string,
    @Req() req: Request,
  ) {
    return this.supportService.archiveTicket(workspaceId, ticketId, actorId, this.extractMeta(req));
  }

  @Post('sessions')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a consent-based support session' })
  async createSession(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateSessionDto,
    @Req() req: Request,
  ) {
    return this.supportService.createSession(actorId, { ...dto, workspaceId }, this.extractMeta(req));
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @ApiOperation({ summary: 'List support sessions for a workspace' })
  async listSessions(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Query() filters: { status?: string; limit?: number; cursor?: string },
  ) {
    return this.supportService.listSessions(workspaceId, actorId, filters);
  }

  @Patch('sessions/:sessionId/end')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @ApiOperation({ summary: 'End a support session' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  async endSession(
    @CurrentUser('id') actorId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: Request,
  ) {
    return this.supportService.endSession(sessionId, actorId, this.extractMeta(req));
  }
}

// Platform-level support routes (cross-workspace, staff only)
@ApiTags('Platform Support')
@ApiBearerAuth()
@Controller({ path: 'platform/v1/support', version: '1' })
export class PlatformSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @RequirePlatformRoles(
    PlatformStaffRoleType.SUPPORT_AGENT,
    PlatformStaffRoleType.PLATFORM_ADMIN,
    PlatformStaffRoleType.SUPERADMIN,
  )
  @ApiOperation({ summary: 'List all support tickets across workspaces (platform staff)' })
  async listAllTickets(@Query() filters: { status?: string; priority?: string; assigneeId?: string; limit?: number; cursor?: string }) {
    return this.supportService.listAllTickets(filters);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  @RequirePlatformRoles(
    PlatformStaffRoleType.SUPPORT_AGENT,
    PlatformStaffRoleType.PLATFORM_ADMIN,
    PlatformStaffRoleType.SUPERADMIN,
  )
  @ApiOperation({ summary: 'List all support sessions across workspaces (platform staff)' })
  async listAllSessions(@Query() filters: { status?: string; limit?: number; cursor?: string }) {
    return this.supportService.listAllSessions(filters);
  }
}
