import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentWorkspace, RequireWorkspaceRole } from '../auth/decorators/authorization.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { FilesService } from './files.service';

interface FileIntentBody {
  originalName: string;
  size: number;
  contentType: string;
}

interface FileFinalizeBody {
  objectKey: string;
}

@Controller('workspaces/:workspaceId/files')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @Get()
  list(@CurrentWorkspace('workspaceId') workspaceId: string) {
    return this.service.list(workspaceId);
  }

  @Post('intent')
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  intent(
    @CurrentUser() user: { id: string },
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @Body() body: FileIntentBody,
  ) {
    return this.service.createIntent(workspaceId, user.id, {
      originalName: body.originalName,
      contentType: body.contentType,
      size: body.size,
    });
  }

  @Post(':id/finalize')
  @RequireWorkspaceRole(WorkspaceRole.MEMBER)
  finalize(@CurrentWorkspace('workspaceId') workspaceId: string, @Param('id') id: string, @Body() body: FileFinalizeBody) {
    return this.service.finalize(id, workspaceId, body.objectKey);
  }

  @Get(':id')
  get(@CurrentWorkspace('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.service.get(workspaceId, id);
  }

  @Delete(':id')
  @RequireWorkspaceRole(WorkspaceRole.TEAM_ADMIN)
  remove(@CurrentWorkspace('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.service.remove(workspaceId, id);
  }
}
