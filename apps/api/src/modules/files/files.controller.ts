import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';

interface FileIntentBody {
  workspaceId: string;
  originalName: string;
  size: number;
  contentType: string;
}

interface FileFinalizeBody {
  workspaceId: string;
  objectKey: string;
}

interface FileGetBody {
  workspaceId: string;
}

interface FileRemoveBody {
  workspaceId: string;
}

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @Post('intent')
  intent(@CurrentUser() user: { id: string }, @Body() body: FileIntentBody) {
    return this.service.createIntent(body.workspaceId, user.id, {
      originalName: body.originalName,
      contentType: body.contentType,
      size: body.size,
    });
  }

  @Post(':id/finalize')
  finalize(@CurrentUser() _user: { id: string }, @Param('id') id: string, @Body() body: FileFinalizeBody) {
    return this.service.finalize(id, body.workspaceId);
  }

  @Get(':id')
  get(@CurrentUser() _user: { id: string }, @Param('id') id: string, @Body() body: FileGetBody) {
    return this.service.get(body.workspaceId, id);
  }

  @Delete(':id')
  remove(@CurrentUser() _user: { id: string }, @Param('id') id: string, @Body() body: FileRemoveBody) {
    return this.service.remove(body.workspaceId, id);
  }
}
