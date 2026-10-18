import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PolicyService } from '../../common/policy/policy.service';
import { AuditLogService, recordDomainChange } from '../audit/audit.service';
import { UpdateWorkspaceSettingsDto } from './dto/update-workspace-settings.dto';
import {
  AuditAction,
  WorkspaceRole,
  EntityType,
  ActivityAction,
} from '@prisma/client';
import { RequestMeta } from '../auth/auth.service';

@Injectable()
export class WorkspaceSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policyService: PolicyService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getSettings(workspaceId: string, actorId: string) {
    await this.policyService.getWorkspaceContext(actorId, workspaceId);

    return this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });
  }

  async updateSettings(
    workspaceId: string,
    actorId: string,
    dto: UpdateWorkspaceSettingsDto,
    meta?: RequestMeta,
  ) {
    await this.policyService.requireWorkspaceRole(
      actorId,
      workspaceId,
      WorkspaceRole.TEAM_ADMIN,
    );
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('At least one workspace setting must be provided');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const settings = await tx.workspaceSettings.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          companyName: dto.companyName,
          companyEmail: dto.companyEmail,
        },
        update: {
          companyName: dto.companyName !== undefined ? dto.companyName : undefined,
          companyEmail: dto.companyEmail !== undefined ? dto.companyEmail : undefined,
        },
      });

      await recordDomainChange(tx, this.auditLogService, {
        workspaceId,
        actorId,
        entityType: EntityType.WORKSPACE,
        entityId: workspaceId,
        activityAction: ActivityAction.WORKSPACE_SETTINGS_UPDATE,
        auditAction: AuditAction.WORKSPACE_SETTINGS_UPDATE,
        targetType: 'WorkspaceSettings',
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { operation: 'update' },
      });

      return settings;
    });

    return updated;
  }
}
