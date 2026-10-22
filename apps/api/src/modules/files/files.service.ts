import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async createIntent(workspaceId: string, ownerId: string, data: { originalName: string; contentType: string; size: number }) {
    const objectKey = `${workspaceId}/${crypto.randomUUID()}`;
    return this.prisma.fileAsset.create({
      data: {
        workspaceId,
        ownerId,
        objectKey,
        originalName: data.originalName,
        contentType: data.contentType,
        size: data.size,
        scanStatus: 'PENDING',
        status: 'PENDING',
      },
    });
  }

  async finalize(id: string, workspaceId: string) {
    return this.prisma.fileAsset.updateMany({
      where: { id, workspaceId },
      data: { status: 'READY' },
    });
  }

  async get(workspaceId: string, id: string) {
    return this.prisma.fileAsset.findFirst({ where: { id, workspaceId } });
  }

  async remove(workspaceId: string, id: string) {
    return this.prisma.fileAsset.updateMany({
      where: { id, workspaceId },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });
  }
}
