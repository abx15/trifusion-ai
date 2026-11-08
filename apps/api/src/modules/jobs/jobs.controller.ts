import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentWorkspace, RequireWorkspaceRole } from '../auth/decorators/authorization.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { JobsService } from './jobs.service';

@Controller('jobs')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Get()
  list(@CurrentWorkspace('workspaceId') workspaceId: string) {
    return this.service.list(workspaceId);
  }

  @Post()
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  create(@CurrentWorkspace('workspaceId') workspaceId: string) {
    return this.service.create(workspaceId, 'manual');
  }
}
