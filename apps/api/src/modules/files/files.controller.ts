import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @Post('intent')
  intent(@CurrentUser() user: any, @Body() body: any) {
    return this.service.createIntent(body.workspaceId, user.id, body);
  }

  @Post(':id/finalize')
  finalize(@CurrentUser() _user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.finalize(id, body.workspaceId);
  }

  @Get(':id')
  get(@CurrentUser() _user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.get(body.workspaceId, id);
  }

  @Delete(':id')
  remove(@CurrentUser() _user: any, @Param('id') id: string, @Body() body: any) {
    return this.service.remove(body.workspaceId, id);
  }
}
