import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { Request, Response as ExpressResponse } from 'express';
import { AiService } from './ai.service';
import { AiGuard, RequireAiCapability } from './ai.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentWorkspace } from '../auth/decorators/authorization.decorators';
import { AuditLogService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import { ProjectSummaryDto } from './dto/project-summary.dto';
import { WeeklyReportDto } from './dto/weekly-report.dto';
import { TaskSuggestionsDto } from './dto/task-suggestions.dto';
import { AssistantDto } from './dto/assistant.dto';
import { WorkspaceRole } from '@prisma/client';
import { RequireWorkspaceRole } from '../auth/decorators/authorization.decorators';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@Controller({ path: 'workspaces/:workspaceId/ai', version: '1' })
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private extractMeta(req: Request) {
    return {
      ip: req.ip || (req.headers['x-forwarded-for'] as string),
      userAgent: req.headers['user-agent'],
      requestId: req.correlationId || (req.headers['x-request-id'] as string),
    };
  }

  // ============================================
  // PROJECT SUMMARY
  // ============================================

  @Post('project-summary')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, AiGuard)
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @RequireAiCapability('project_summary')
  @ApiOperation({ summary: 'Generate a project summary from authorized task and activity data' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Project summary generated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or quota exceeded' })
  async generateProjectSummary(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @CurrentWorkspace() workspace: { role: WorkspaceRole },
    @Body() dto: ProjectSummaryDto,
    @Req() req: Request,
  ) {
    // Verify the workspaceId in the DTO matches the route parameter
    if (dto.workspace_id !== workspaceId) {
      throw new ForbiddenException('Workspace ID mismatch');
    }

    // Verify user_id matches the authenticated user
    if (dto.user_id !== userId) {
      throw new ForbiddenException('User ID mismatch');
    }

    // Set role from verified workspace context
    dto.role = workspace.role;

    const result = await this.aiService.generateProjectSummary({
      ...dto,
      tasks: dto.tasks ?? [],
      activity: dto.activity ?? [],
      request_id: this.extractMeta(req).requestId,
    });

    await this.auditLogService.log({
      actorId: userId,
      action: AuditAction.USER_SIGNUP, // Reuse closest action; ideally AI_SUMMARY_GENERATE
      targetType: 'Project',
      targetId: dto.project_id,
      workspaceId,
      requestId: this.extractMeta(req).requestId,
      ip: this.extractMeta(req).ip,
      userAgent: this.extractMeta(req).userAgent,
      metadata: { capability: 'project_summary', projectId: dto.project_id },
    });

    return result;
  }

  // ============================================
  // WEEKLY REPORT
  // ============================================

  @Post('weekly-report')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, AiGuard)
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @RequireAiCapability('weekly_report')
  @ApiOperation({ summary: 'Generate a weekly report from real analytics data' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Weekly report generated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or quota exceeded' })
  async generateWeeklyReport(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @CurrentWorkspace() workspace: { role: WorkspaceRole },
    @Body() dto: WeeklyReportDto,
    @Req() req: Request,
  ) {
    if (dto.workspace_id !== workspaceId) {
      throw new ForbiddenException('Workspace ID mismatch');
    }

    if (dto.user_id !== userId) {
      throw new ForbiddenException('User ID mismatch');
    }

    dto.role = workspace.role;

    const result = await this.aiService.generateWeeklyReport({
      ...dto,
      request_id: this.extractMeta(req).requestId,
    });

    await this.auditLogService.log({
      actorId: userId,
      action: AuditAction.USER_SIGNUP,
      targetType: 'Report',
      targetId: workspaceId,
      workspaceId,
      requestId: this.extractMeta(req).requestId,
      ip: this.extractMeta(req).ip,
      userAgent: this.extractMeta(req).userAgent,
      metadata: { capability: 'weekly_report', reportingPeriod: dto.reporting_period },
    });

    return result;
  }

  // ============================================
  // TASK SUGGESTIONS
  // ============================================

  @Post('task-suggestions')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, AiGuard)
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @RequireAiCapability('task_suggestions')
  @ApiOperation({ summary: 'Get AI task suggestions based on task and project context' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Task suggestions generated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or quota exceeded' })
  async getTaskSuggestions(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @CurrentWorkspace() workspace: { role: WorkspaceRole },
    @Body() dto: TaskSuggestionsDto,
    @Req() req: Request,
  ) {
    if (dto.workspace_id !== workspaceId) {
      throw new ForbiddenException('Workspace ID mismatch');
    }

    if (dto.user_id !== userId) {
      throw new ForbiddenException('User ID mismatch');
    }

    dto.role = workspace.role;

    const result = await this.aiService.getTaskSuggestions({
      workspace_id: dto.workspace_id,
      user_id: dto.user_id,
      role: dto.role,
      task_id: dto.task_id,
      task: {
        id: dto.task.id,
        title: dto.task.title,
        status: dto.task.status,
        priority: dto.task.priority ?? 'MEDIUM',
      },
      project: dto.project,
      request_id: this.extractMeta(req).requestId,
    });

    await this.auditLogService.log({
      actorId: userId,
      action: AuditAction.USER_SIGNUP,
      targetType: 'Task',
      targetId: dto.task_id,
      workspaceId,
      requestId: this.extractMeta(req).requestId,
      ip: this.extractMeta(req).ip,
      userAgent: this.extractMeta(req).userAgent,
      metadata: { capability: 'task_suggestions', taskId: dto.task_id },
    });

    return result;
  }

  // ============================================
  // WORKSPACE ASSISTANT
  // ============================================

  @Post('assistant')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, AiGuard)
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @RequireAiCapability('workspace_assistant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Answer workspace questions from authorized data' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'Assistant response' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or quota exceeded' })
  async askAssistant(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @CurrentWorkspace() workspace: { role: WorkspaceRole },
    @Body() dto: AssistantDto,
    @Req() req: Request,
  ) {
    if (dto.workspace_id !== workspaceId) {
      throw new ForbiddenException('Workspace ID mismatch');
    }

    if (dto.user_id !== userId) {
      throw new ForbiddenException('User ID mismatch');
    }

    dto.role = workspace.role;

    const result = await this.aiService.askAssistant({
      ...dto,
      retrieved_context: dto.retrieved_context ?? [],
      request_id: this.extractMeta(req).requestId,
    });

    await this.auditLogService.log({
      actorId: userId,
      action: AuditAction.USER_SIGNUP,
      targetType: 'Assistant',
      targetId: workspaceId,
      workspaceId,
      requestId: this.extractMeta(req).requestId,
      ip: this.extractMeta(req).ip,
      userAgent: this.extractMeta(req).userAgent,
      metadata: { capability: 'workspace_assistant', question: dto.question.substring(0, 200) },
    });

    return result;
  }

  // ============================================
  // WORKSPACE ASSISTANT STREAM (SSE proxy)
  // ============================================

  @Post('assistant/stream')
  @UseGuards(JwtAuthGuard, WorkspaceGuard, AiGuard)
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  @RequireAiCapability('workspace_assistant')
  @ApiOperation({ summary: 'Stream assistant response via SSE (NestJS proxies Django)' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace UUID' })
  @ApiResponse({ status: 200, description: 'SSE stream initiated' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or quota exceeded' })
  async streamAssistant(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @CurrentWorkspace() workspace: { role: WorkspaceRole },
    @Body() dto: AssistantDto,
    @Req() req: Request,
    @Res() response: ExpressResponse,
  ) {
    if (dto.workspace_id !== workspaceId) {
      throw new ForbiddenException('Workspace ID mismatch');
    }

    if (dto.user_id !== userId) {
      throw new ForbiddenException('User ID mismatch');
    }

    dto.role = workspace.role;

    // NestJS creates the service token and proxies the stream to Django.
    // The frontend connects to this NestJS endpoint, never directly to Django.
    const streamInfo = await this.aiService.streamAssistant({
      ...dto,
      retrieved_context: dto.retrieved_context ?? [],
      request_id: this.extractMeta(req).requestId,
    });

    await this.auditLogService.log({
      actorId: userId,
      action: AuditAction.USER_SIGNUP,
      targetType: 'Assistant',
      targetId: workspaceId,
      workspaceId,
      requestId: this.extractMeta(req).requestId,
      ip: this.extractMeta(req).ip,
      userAgent: this.extractMeta(req).userAgent,
      metadata: { capability: 'workspace_assistant_stream', question: dto.question.substring(0, 200) },
    });

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Request-Id', streamInfo.requestId);

    const reader = streamInfo.response.body!.getReader();
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        response.write(Buffer.from(chunk.value));
      }
    } finally {
      reader.releaseLock();
      response.end();
    }
  }
}
