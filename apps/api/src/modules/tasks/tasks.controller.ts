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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { ListTasksQueryDto } from './dto/list-tasks.dto';
import { WorkspaceRole } from '@prisma/client';
import { RequestMeta } from '../auth/auth.service';
import { Task, TaskConnection } from './entities/task.entity';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller({ path: 'workspaces/:workspaceId/tasks', version: '1' })
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

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
  @ApiOperation({ summary: 'Create a task' })
  @ApiResponse({ status: 201, description: 'Task created', type: Task })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createTask(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateTaskDto,
    @Req() req: Request,
  ) {
    return this.tasksService.createTask(workspaceId, actorId, dto, this.extractMeta(req));
  }

  @Get()
  @ApiOperation({ summary: 'List tasks (cursor-paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated task list', type: TaskConnection })
  async listTasks(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Query() dto: ListTasksQueryDto,
  ) {
    return this.tasksService.listTasks(workspaceId, actorId, dto);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'taskId', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task details', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTask(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.tasksService.getTask(workspaceId, actorId, taskId);
  }

  @Patch(':taskId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'taskId', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task updated', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async updateTask(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: Request,
  ) {
    return this.tasksService.updateTask(workspaceId, actorId, taskId, dto, this.extractMeta(req));
  }

  @Patch(':taskId/status')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @ApiOperation({ summary: 'Update task status' })
  @ApiParam({ name: 'taskId', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task status updated', type: Task })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async updateTaskStatus(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: Request,
  ) {
    return this.tasksService.updateTaskStatus(workspaceId, actorId, taskId, dto, this.extractMeta(req));
  }

  @Delete(':taskId/archive')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Soft-delete (archive) a task' })
  @ApiParam({ name: 'taskId', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task archived', type: Task })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async archiveTask(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('taskId') taskId: string,
    @Req() req: Request,
  ) {
    return this.tasksService.archiveTask(workspaceId, actorId, taskId, this.extractMeta(req));
  }

  @Patch(':taskId/restore')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  @ApiOperation({ summary: 'Restore an archived task' })
  @ApiParam({ name: 'taskId', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task restored', type: Task })
  async restoreTask(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Param('taskId') taskId: string,
    @Req() req: Request,
  ) {
    return this.tasksService.restoreTask(workspaceId, actorId, taskId, this.extractMeta(req));
  }
}
