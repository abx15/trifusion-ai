import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { CurrentUser, CurrentWorkspace } from '../auth/decorators/authorization.decorators';
import { ActivityService } from './activity.service';
import { ListActivityQueryDto } from './dto/list-activity.dto';
import { ActivityEventConnection } from './entities/activity-event.entity';

@ApiTags('Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@Controller({ path: 'workspaces/:workspaceId/activity', version: '1' })
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'List activity feed (cursor-paginated)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated activity events',
    type: ActivityEventConnection,
  })
  async listActivity(
    @CurrentWorkspace('workspaceId') workspaceId: string,
    @CurrentUser('id') actorId: string,
    @Query() dto: ListActivityQueryDto,
  ) {
    return this.activityService.listActivity(workspaceId, actorId, dto);
  }
}
