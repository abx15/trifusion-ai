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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { RequireWorkspaceRole } from '../auth/decorators/authorization.decorators';
import { CurrentUser, CurrentWorkspace } from '../auth/decorators/authorization.decorators';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListClientsQueryDto } from './dto/list-clients.dto';
import { WorkspaceRole } from '@prisma/client';
import { RequestMeta } from '../auth/auth.service';
import { Client, ClientConnection } from './entities/client.entity';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller({ path: 'workspaces/:workspaceId/clients', version: '1' })
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  private extractMeta(req: Request): RequestMeta {
    return {
      ip: req.ip || (req.headers['x-forwarded-for'] as string),
      userAgent: req.headers['user-agent'],
      requestId: req.correlationId || (req.headers['x-request-id'] as string),
    };
  }

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @ApiOperation({ summary: 'Create a client' })
  @ApiResponse({ status: 201, description: 'Client created', type: Client })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createClient(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateClientDto,
    @Req() req: Request,
  ) {
    return this.clientsService.createClient(workspaceId, actorId, dto, this.extractMeta(req));
  }

  @Get()
  @ApiOperation({ summary: 'List clients (cursor-paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated client list', type: ClientConnection })
  async listClients(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Query() dto: ListClientsQueryDto,
  ) {
    return this.clientsService.listClients(workspaceId, actorId, dto);
  }

  @Get(':clientId')
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Client details', type: Client })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClient(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.clientsService.getClient(workspaceId, actorId, clientId);
  }

  @Patch(':clientId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @ApiOperation({ summary: 'Update a client' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Client updated', type: Client })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async updateClient(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('clientId') clientId: string,
    @Body() dto: UpdateClientDto,
    @Req() req: Request,
  ) {
    return this.clientsService.updateClient(workspaceId, actorId, clientId, dto, this.extractMeta(req));
  }

  @Delete(':clientId/archive')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Soft-delete (archive) a client' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Client archived', type: Client })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async archiveClient(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('clientId') clientId: string,
    @Req() req: Request,
  ) {
    return this.clientsService.archiveClient(workspaceId, actorId, clientId, this.extractMeta(req));
  }

  @Patch(':clientId/restore')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Restore an archived client' })
  @ApiParam({ name: 'clientId', description: 'Client UUID' })
  @ApiResponse({ status: 200, description: 'Client restored', type: Client })
  async restoreClient(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('clientId') clientId: string,
    @Req() req: Request,
  ) {
    return this.clientsService.restoreClient(workspaceId, actorId, clientId, this.extractMeta(req));
  }
}
