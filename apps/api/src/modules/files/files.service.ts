import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ObjectStorageService } from './object-storage.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ObjectStorageService,
  ) {}

  async list(workspaceId: string) {
    return this.prisma.fileAsset.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createIntent(workspaceId: string, ownerId: string, data: { originalName: string; contentType: string; size: number }) {
    const objectKey = `${workspaceId}/${crypto.randomUUID()}`;
    const asset = await this.prisma.fileAsset.create({
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
    return {
      ...asset,
      uploadUrl: await this.storage.createUploadUrl(objectKey, data.contentType),
    };
  }

  async finalize(id: string, workspaceId: string, objectKey: string) {
    return this.prisma.fileAsset.updateMany({
      where: { id, workspaceId, objectKey, deletedAt: null },
      data: { status: 'READY' },
    });
  }

  async get(workspaceId: string, id: string) {
    const asset = await this.prisma.fileAsset.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!asset) throw new NotFoundException('File not found');
    return { ...asset, downloadUrl: await this.storage.createDownloadUrl(asset.objectKey) };
  }

  async remove(workspaceId: string, id: string) {
    return this.prisma.fileAsset.updateMany({
      where: { id, workspaceId },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });
  }
}
