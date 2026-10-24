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
    const start = Date.now();

    try {
      // This would check Redis connection - placeholder for now
      // In real implementation, use Redis client ping
      const latency = Date.now() - start;

      return { status: 'up', latency };
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
    try {
      // This would check BullMQ health - placeholder for now
      // In real implementation, check queue depth and failed jobs
      return { status: 'up' };
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
    try {
      // This would check Django AI service health - placeholder for now
      // In real implementation, call /health endpoint on AI service
      return { status: 'up' };
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
    try {
      // This would check S3-compatible storage health - placeholder for now
      // In real implementation, check bucket access and list objects
      return { status: 'up' };
    } catch (error) {
      this.logger.error('Storage health check failed', error);
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Determine overall status from individual services
   */
  private determineOverallStatus(services: HealthStatus['services']): 'healthy' | 'degraded' | 'unhealthy' {
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
    const [totalUsers, totalWorkspaces, activeWorkspaces, totalProjects, totalTasks] = await Promise.all([
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.workspace.count(),
      this.prisma.workspace.count({ where: { status: 'ACTIVE' } }),
      this.prisma.project.count({ where: { deletedAt: null } }),
      this.prisma.task.count({ where: { deletedAt: null } }),
    ]);

    // Get recent user signups (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignups = await this.prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: 'ACTIVE',
      },
    });

    return {
      totalUsers,
      totalWorkspaces,
      activeWorkspaces,
      totalProjects,
      totalTasks,
      recentSignups,
      timestamp: new Date().toISOString(),
    };
  }
}
