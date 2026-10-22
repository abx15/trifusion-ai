import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(workspaceId: string | null, type: string, idempotencyKey?: string) {
    return this.prisma.jobRecord.create({
      data: { jobId: `job_${Date.now()}`, workspaceId: workspaceId ?? undefined, type, status: 'queued', idempotencyKey },
    });
  }

  async updateStatus(jobId: string, status: string, lastError?: string, attempts?: number) {
    return this.prisma.jobRecord.updateMany({
      where: { jobId },
      data: { status, lastError, ...(attempts !== undefined ? { attempts } : {}) },
    });
  }

  async list(workspaceId?: string) {
    return this.prisma.jobRecord.findMany({ where: workspaceId ? { workspaceId } : {}, orderBy: { createdAt: 'desc' }, take: 50 });
  }
}
