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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ListProjectsQueryDto } from './dto/list-projects.dto';
import { WorkspaceRole } from '@prisma/client';
import { RequestMeta } from '../auth/auth.service';
import { Project, ProjectConnection } from './entities/project.entity';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller({ path: 'workspaces/:workspaceId/projects', version: '1' })
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

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
  @ApiOperation({ summary: 'Create a project' })
  @ApiResponse({ status: 201, description: 'Project created', type: Project })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createProject(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateProjectDto,
    @Req() req: Request,
  ) {
    return this.projectsService.createProject(workspaceId, actorId, dto, this.extractMeta(req));
  }

  @Get()
  @ApiOperation({ summary: 'List projects (cursor-paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated project list', type: ProjectConnection })
  async listProjects(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Query() dto: ListProjectsQueryDto,
  ) {
    return this.projectsService.listProjects(workspaceId, actorId, dto);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project details', type: Project })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProject(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.getProject(workspaceId, actorId, projectId);
  }

  @Patch(':projectId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project updated', type: Project })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async updateProject(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
    @Req() req: Request,
  ) {
    return this.projectsService.updateProject(workspaceId, actorId, projectId, dto, this.extractMeta(req));
  }

  @Delete(':projectId/archive')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Soft-delete (archive) a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project archived', type: Project })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async archiveProject(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('projectId') projectId: string,
    @Req() req: Request,
  ) {
    return this.projectsService.archiveProject(workspaceId, actorId, projectId, this.extractMeta(req));
  }

  @Patch(':projectId/restore')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Restore an archived project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project restored', type: Project })
  async restoreProject(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('projectId') projectId: string,
    @Req() req: Request,
  ) {
    return this.projectsService.restoreProject(workspaceId, actorId, projectId, this.extractMeta(req));
  }
}
