import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PolicyService } from '../../common/policy/policy.service';
import { ListActivityQueryDto } from './dto/list-activity.dto';
import { Prisma } from '@prisma/client';
import { normalizeLimit, decodeCursor, encodeCursor } from '../../common/pagination/cursor-pagination';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: PolicyService,
  ) {}

  async listActivity(
    workspaceId: string,
    actorId: string,
    dto: ListActivityQueryDto,
  ) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);

    const limit = normalizeLimit({ limit: dto.limit, maxLimit: 50, defaultLimit: 20 });
    const cursor = decodeCursor(dto.cursor);

    const where: Prisma.ActivityEventWhereInput = {
      workspaceId,
      ...(dto.entityType ? { entityType: dto.entityType } : {}),
      ...(dto.entityId ? { entityId: dto.entityId } : {}),
      ...(dto.actorId ? { actorId: dto.actorId } : {}),
    };

    const direction = dto.sortOrder ?? 'desc';
    const [data, total] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : undefined,
        orderBy: [{ createdAt: direction }, { id: direction }],
        include: { actor: { select: { id: true, email: true } } },
      }),
      this.prisma.activityEvent.count({ where }),
    ]);

    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, -1) : data;
    const nextCursor = hasMore ? encodeCursor(items[items.length - 1]!.id) : null;

    return {
      data: items,
      nextCursor,
      hasMore,
      total,
      limit,
    };
  }
}
