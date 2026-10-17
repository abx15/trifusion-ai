import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

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

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append-only audit logger. Never throws to prevent disrupting core operations.
   */
  async log(options: LogAuditOptions): Promise<void> {
    try {
      const sanitizedMetadata = options.metadata
        ? (redactSensitiveData(options.metadata) as Prisma.InputJsonValue)
        : Prisma.JsonNull;

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
    limit?: number;
    offset?: number;
  }) {
    const { workspaceId, actorId, action, limit = 50, offset = 0 } = params;

    const where: Prisma.AuditLogWhereInput = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (actorId) where.actorId = actorId;
    if (action) where.action = action;

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
}
