import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    queue: ServiceHealth;
    aiService: ServiceHealth;
    storage: ServiceHealth;
  };
  timestamp: string;
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
}

@Injectable()
export class PlatformHealthService {
  private readonly logger = new Logger(PlatformHealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get comprehensive platform health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const [dbHealth, redisHealth, queueHealth, aiHealth, storageHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueue(),
      this.checkAIService(),
      this.checkStorage(),
    ]);

    const services = {
      database: dbHealth,
      redis: redisHealth,
      queue: queueHealth,
      aiService: aiHealth,
      storage: storageHealth,
    };

    const overallStatus = this.determineOverallStatus(services);

    return {
      status: overallStatus,
      services,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      if (latency > 1000) {
        return { status: 'degraded', latency };
      }

      return { status: 'up', latency };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<ServiceHealth> {
    if (!process.env.REDIS_URL) {
      return { status: 'degraded', error: 'Redis is not configured' };
    }

    const start = Date.now();

    try {
      const { default: Redis } = await import('ioredis');
      const client = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
      });
      await client.connect();
      await client.ping();
      const latency = Date.now() - start;
      await client.quit();
      return { status: latency > 1000 ? 'degraded' : 'up', latency };
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check queue health (BullMQ)
   */
  private async checkQueue(): Promise<ServiceHealth> {
    if (!process.env.REDIS_URL) {
      return { status: 'degraded', error: 'Queue backend is not configured' };
    }

    try {
      const failedJobs = await this.prisma.jobRecord.count({
        where: { status: { in: ['FAILED', 'ERROR'] } },
      });
      return failedJobs > 0
        ? { status: 'degraded', error: `${failedJobs} failed background job(s)` }
        : { status: 'up' };
    } catch (error) {
      this.logger.error('Queue health check failed', error);
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check AI service health
   */
  private async checkAIService(): Promise<ServiceHealth> {
    const baseUrl = process.env.AI_SERVICE_URL;
    if (!baseUrl) {
      return { status: 'degraded', error: 'AI service is not configured' };
    }

    const start = Date.now();
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      const latency = Date.now() - start;
      if (!response.ok) {
        return { status: 'down', latency, error: `AI service returned HTTP ${response.status}` };
      }
      return { status: latency > 1000 ? 'degraded' : 'up', latency };
    } catch (error) {
      this.logger.error('AI service health check failed', error);
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check storage health (S3-compatible)
   */
  private async checkStorage(): Promise<ServiceHealth> {
    if (!process.env.S3_ENDPOINT && !process.env.AWS_S3_BUCKET) {
      return { status: 'degraded', error: 'Object storage is not configured' };
    }

    return { status: 'degraded', error: 'Object storage is configured but has no health probe' };
  }

  /**
   * Determine overall status from individual services
   */
  private determineOverallStatus(
    services: HealthStatus['services']
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = Object.values(services).map((s) => s.status);

    if (statuses.every((s) => s === 'up')) {
      return 'healthy';
    }

    if (statuses.some((s) => s === 'down')) {
      return 'unhealthy';
    }

    return 'degraded';
  }

  /**
   * Get platform metrics for dashboard
   */
  async getPlatformMetrics() {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      unverifiedUsers,
      suspendedUsers,
      totalWorkspaces,
      activeWorkspaces,
      suspendedWorkspaces,
      totalProjects,
      totalTasks,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'ACTIVE', isEmailVerified: true } }),
      this.prisma.user.count({ where: { status: 'ACTIVE', isEmailVerified: false } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.workspace.count(),
      this.prisma.workspace.count({ where: { status: 'ACTIVE' } }),
      this.prisma.workspace.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.task.count({ where: { deletedAt: null } }),
    ]);

    // Get recent user signups (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignups = await this.prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });
    const userGrowthRows = await this.prisma.$queryRaw<
      Array<{ period: Date; users: bigint; tenants: bigint }>
    >`
      SELECT
        DATE_TRUNC('month', periods.period) AS period,
        COUNT(DISTINCT users.id) AS users,
        COUNT(DISTINCT workspaces.id) AS tenants
      FROM generate_series(
        DATE_TRUNC('month', NOW()) - INTERVAL '5 months',
        DATE_TRUNC('month', NOW()),
        INTERVAL '1 month'
      ) AS periods(period)
      LEFT JOIN "User" users
        ON DATE_TRUNC('month', users."createdAt") = periods.period
      LEFT JOIN "Workspace" workspaces
        ON DATE_TRUNC('month', workspaces."createdAt") = periods.period
      GROUP BY periods.period
      ORDER BY periods.period ASC
    `;
    const usageGroups = await this.prisma.activityEvent.groupBy({
      by: ['action'],
      _count: { _all: true },
      orderBy: { _count: { action: 'desc' } },
      take: 10,
    });
    const storage = await this.prisma.fileAsset.aggregate({
      where: { deletedAt: null },
      _count: { _all: true },
      _sum: { size: true },
    });

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      unverifiedUsers,
      suspendedUsers,
      totalWorkspaces,
      activeWorkspaces,
      suspendedWorkspaces,
      totalProjects,
      totalTasks,
      recentSignups,
      userGrowth: userGrowthRows.map((row) => ({
        name: row.period.toISOString().slice(0, 7),
        users: Number(row.users),
        tenants: Number(row.tenants),
      })),
      usageDistribution: usageGroups.map((row) => ({
        name: row.action.replaceAll('_', ' '),
        value: row._count._all,
      })),
      resourceConsumption: [
        { name: 'Files', used: storage._count._all, total: storage._count._all },
        { name: 'Storage bytes', used: storage._sum.size ?? 0, total: storage._sum.size ?? 0 },
      ],
      apiTrends: [],
      performanceTrends: [],
      unavailableMetrics: ['apiRequests', 'apiErrors', 'responseLatency', 'p95Latency'],
      dataFreshness: 'live',
      timestamp: new Date().toISOString(),
    };
  }
}
