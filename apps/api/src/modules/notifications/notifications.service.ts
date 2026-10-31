import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(recipientId: string, cursor?: string, workspaceId?: string) {
    return this.prisma.notification.findMany({
      where: { recipientId, ...(workspaceId ? { workspaceId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 20,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async unreadCount(recipientId: string, workspaceId?: string) {
    return this.prisma.notification.count({
      where: { recipientId, readAt: null, ...(workspaceId ? { workspaceId } : {}) },
    });
  }

  async markRead(recipientId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, recipientId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(recipientId: string, workspaceId?: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId, readAt: null, ...(workspaceId ? { workspaceId } : {}) },
      data: { readAt: new Date() },
    });
  }

  async create(data: { recipientId: string; workspaceId?: string; type: string; payload: Record<string, unknown>; dedupeKey?: string }) {
    return this.prisma.notification.create({
      data: {
        recipientId: data.recipientId,
        workspaceId: data.workspaceId,
        type: data.type,
        payload: data.payload as Prisma.InputJsonValue,
        dedupeKey: data.dedupeKey,
      },
    });
  }
}

