import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityAction, AuditAction, EntityType, Prisma } from '@prisma/client';
import { createHash } from 'crypto';

export interface LogAuditOptions {
  actorId: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  workspaceId?: string | null;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  actorType?: string;
  grantId?: string;
  outcome?: string;
}

export interface DomainChangeOptions {
  actorId: string;
  workspaceId: string;
  entityType: EntityType;
  entityId: string;
  activityAction: ActivityAction;
  auditAction: AuditAction;
  targetType: string;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'newpassword',
  'token',
  'tokenhash',
  'refreshtoken',
  'accesstoken',
  'secret',
  'auth_secret',
  'authorization',
]);

function redactSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private readonly CHAIN_SEED = 'trifusion-audit-chain-seed-v1';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Compute chain hash for audit log entry
   * chainHash = SHA256(previousChainHash || action || actorId || targetId || workspaceId || timestamp || normalizedMetadata)
   */
  private computeChainHash(
    previousHash: string,
    action: string,
    actorId: string,
    targetId: string,
    workspaceId: string | null,
    timestamp: Date,
    metadata: unknown,
  ): string {
    const normalizedMetadata =
      metadata && metadata !== Prisma.JsonNull
        ? typeof metadata === 'string'
          ? metadata
          : JSON.stringify(metadata)
        : '';
    const dataToHash = `${previousHash}|${action}|${actorId}|${targetId}|${workspaceId || ''}|${timestamp.toISOString()}|${normalizedMetadata}`;
    return createHash('sha256').update(dataToHash).digest('hex');
  }

  /**
   * Get the most recent audit log entry for chain continuity
   */
  private async getLastAuditLog(): Promise<{ id: string; chainHash: string } | null> {
    const lastLog = await this.prisma.auditLog.findFirst({
      where: { chainHash: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, chainHash: true },
    });
    return lastLog ? { id: lastLog.id, chainHash: lastLog.chainHash || this.CHAIN_SEED } : null;
  }

  async logInTransaction(
    tx: Prisma.TransactionClient,
    options: LogAuditOptions,
  ): Promise<void> {
    const sanitizedMetadata = options.metadata
      ? (redactSensitiveData(options.metadata) as Prisma.InputJsonValue)
      : Prisma.JsonNull;

    // Get previous hash for chain continuity
    const lastLog = await this.getLastAuditLog();
    const previousHash = lastLog ? lastLog.chainHash : this.CHAIN_SEED;

    const timestamp = new Date();
    const chainHash = this.computeChainHash(
      previousHash,
      options.action,
      options.actorId,
      options.targetId,
      options.workspaceId ?? null,
      timestamp,
      sanitizedMetadata,
    );

    await tx.auditLog.create({
      data: {
        actorId: options.actorId,
        action: options.action,
        targetType: options.targetType,
        targetId: options.targetId,
        workspaceId: options.workspaceId ?? null,
        requestId: options.requestId ?? null,
        ip: options.ip ?? null,
        userAgent: options.userAgent ?? null,
        metadata: sanitizedMetadata,
        createdAt: timestamp,
        chainHash,
        actorType: options.actorType ?? 'USER',
        grantId: options.grantId ?? null,
        outcome: options.outcome ?? 'SUCCESS',
      },
    });
  }

  /**
   * Append-only audit logger. Never throws to prevent disrupting core operations.
   */
  async log(options: LogAuditOptions): Promise<void> {
    try {
      const sanitizedMetadata = options.metadata
        ? (redactSensitiveData(options.metadata) as Prisma.InputJsonValue)
        : Prisma.JsonNull;

      // Get previous hash for chain continuity
      const lastLog = await this.getLastAuditLog();
      const previousHash = lastLog ? lastLog.chainHash : this.CHAIN_SEED;

      const timestamp = new Date();
      const chainHash = this.computeChainHash(
        previousHash,
        options.action,
        options.actorId,
        options.targetId,
        options.workspaceId ?? null,
        timestamp,
        sanitizedMetadata,
      );

      await this.prisma.auditLog.create({
        data: {
          actorId: options.actorId,
          action: options.action,
          targetType: options.targetType,
          targetId: options.targetId,
          workspaceId: options.workspaceId ?? null,
          requestId: options.requestId ?? null,
          ip: options.ip ?? null,
          userAgent: options.userAgent ?? null,
          metadata: sanitizedMetadata,
          createdAt: timestamp,
          chainHash,
          actorType: options.actorType ?? 'USER',
          grantId: options.grantId ?? null,
          outcome: options.outcome ?? 'SUCCESS',
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to record audit log: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  /**
   * Query audit logs with tenant or actor boundary.
   * Note: No delete or update methods are implemented (Append-only).
   */
  async findLogs(params: {
    workspaceId?: string;
    actorId?: string;
    action?: AuditAction;
    targetType?: string;
    grantId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const {
      workspaceId,
      actorId,
      action,
      targetType,
      grantId,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = params;

    const where: Prisma.AuditLogWhereInput = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (actorId) where.actorId = actorId;
    if (action) where.action = action;
    if (targetType) where.targetType = targetType;
    if (grantId) where.grantId = grantId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        take: Math.min(limit, 100),
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return { total, logs, limit, offset };
  }

  /**
   * Verify audit log chain integrity
   * Walks the chain and reports any breaks
   */
  async verifyIntegrity(): Promise<{
    valid: boolean;
    totalEntries: number;
    firstBreakPosition: number | null;
    message: string;
  }> {
    const logs = await this.prisma.auditLog.findMany({
      where: { chainHash: { not: null } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        action: true,
        actorId: true,
        targetId: true,
        workspaceId: true,
        createdAt: true,
        metadata: true,
        chainHash: true,
      },
    });

    if (logs.length === 0) {
      return {
        valid: true,
        totalEntries: 0,
        firstBreakPosition: null,
        message: 'No audit log entries to verify',
      };
    }

    let previousHash = this.CHAIN_SEED;
    let firstBreakPosition: number | null = null;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const expectedHash = this.computeChainHash(
        previousHash,
        log.action,
        log.actorId,
        log.targetId,
        log.workspaceId,
        log.createdAt,
        log.metadata,
      );

      if (log.chainHash !== expectedHash) {
        firstBreakPosition = i + 1;
        break;
      }

      previousHash = log.chainHash;
    }

    return {
      valid: firstBreakPosition === null,
      totalEntries: logs.length,
      firstBreakPosition,
      message: firstBreakPosition
        ? `Chain integrity broken at position ${firstBreakPosition}`
        : 'Audit log chain is intact',
    };
  }
}

export async function recordDomainChange(
  tx: Prisma.TransactionClient,
  auditLogService: AuditLogService,
  options: DomainChangeOptions,
): Promise<void> {
  await tx.activityEvent.create({
    data: {
      workspaceId: options.workspaceId,
      actorId: options.actorId,
      entityType: options.entityType,
      entityId: options.entityId,
      action: options.activityAction,
      metadata: options.requestId ? { requestId: options.requestId } : Prisma.JsonNull,
    },
  });

  await auditLogService.logInTransaction(tx, {
    actorId: options.actorId,
    action: options.auditAction,
    targetType: options.targetType,
    targetId: options.entityId,
    workspaceId: options.workspaceId,
    requestId: options.requestId,
    ip: options.ip,
    userAgent: options.userAgent,
    metadata: options.metadata,
  });
}
