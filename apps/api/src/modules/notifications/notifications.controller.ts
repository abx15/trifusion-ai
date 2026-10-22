import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: any, @Query() dto: ListNotificationsDto) {
    return this.service.list(user.id, dto.cursor, dto.workspaceId);
  }

  @Get('unread-count')
  unread(@CurrentUser() user: any, @Query('workspaceId') workspaceId?: string) {
    return this.service.unreadCount(user.id, workspaceId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.markRead(user.id, id);
  }

  @Patch('read-all')
  markAll(@CurrentUser() user: any, @Query('workspaceId') workspaceId?: string) {
    return this.service.markAllRead(user.id, workspaceId);
  }
}
