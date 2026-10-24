import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface PlanLimits {
  seats: number;
  projects: number;
  storage: number; // bytes
  aiQuota: {
    dailyRequests: number;
    dailyTokens: number;
  };
  features: Record<string, boolean>;
}

export interface EntitlementCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  overage: number;
  resourceName: string;
}

export interface UsageInfo {
  activeMembers: number;
  projectCount: number;
  storageUsed: number; // bytes
  aiDailyRequests: number;
  aiDailyTokens: number;
}

const DEFAULT_FREE_PLAN: PlanLimits = {
  seats: 5,
  projects: 20,
  storage: 10737418240, // 10GB
  aiQuota: {
    dailyRequests: 50,
    dailyTokens: 25000,
  },
  features: {
    advancedAnalytics: false,
    customIntegrations: false,
  },
};

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get current entitlement for a workspace (merged plan + overrides)
   */
  async getCurrentEntitlement(workspaceId: string): Promise<PlanLimits> {
    const now = new Date();

    const entitlement = await this.prisma.entitlement.findFirst({
      where: {
        workspaceId,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      include: { plan: true },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!entitlement) {
      this.logger.warn(`No entitlement found for workspace ${workspaceId}, using default free plan`);
      return DEFAULT_FREE_PLAN;
    }

    const planLimits = this.parsePlanLimits(entitlement.plan.limits as Prisma.JsonObject);
    const overrides = entitlement.overrides as Prisma.JsonObject | null;

    // Merge overrides (overrides take precedence)
    if (overrides) {
      return this.mergeLimits(planLimits, overrides);
    }

    return planLimits;
  }

  /**
   * Check if workspace is within limit for a resource
   */
  async checkLimit(
    workspaceId: string,
    resourceType: 'seats' | 'projects' | 'storage' | 'aiRequests' | 'aiTokens',
  ): Promise<EntitlementCheckResult> {
    const entitlement = await this.getCurrentEntitlement(workspaceId);
    const usage = await this.getUsage(workspaceId);

    let currentUsage: number;
    let limit: number;
    let resourceName: string;

    switch (resourceType) {
      case 'seats':
        currentUsage = usage.activeMembers;
        limit = entitlement.seats;
        resourceName = 'Team members';
        break;
      case 'projects':
        currentUsage = usage.projectCount;
        limit = entitlement.projects;
        resourceName = 'Projects';
        break;
      case 'storage':
        currentUsage = usage.storageUsed;
        limit = entitlement.storage;
        resourceName = 'Storage';
        break;
      case 'aiRequests':
        currentUsage = usage.aiDailyRequests;
        limit = entitlement.aiQuota.dailyRequests;
        resourceName = 'AI daily requests';
        break;
      case 'aiTokens':
        currentUsage = usage.aiDailyTokens;
        limit = entitlement.aiQuota.dailyTokens;
        resourceName = 'AI daily tokens';
        break;
    }

    const overage = Math.max(0, currentUsage - limit);
    const allowed = overage === 0;

    return {
      allowed,
      currentUsage,
      limit,
      overage,
      resourceName,
    };
  }

  /**
   * Get current usage for a workspace
   */
  async getUsage(workspaceId: string): Promise<UsageInfo> {
    const [activeMembers, projectCount, fileAssets, aiUsage] = await Promise.all([
      this.prisma.workspaceMember.count({
        where: { workspaceId, status: 'ACTIVE' },
      }),
      this.prisma.project.count({
        where: { workspaceId, deletedAt: null },
      }),
      this.prisma.fileAsset.aggregate({
        where: { workspaceId, deletedAt: null },
        _sum: { size: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['createdAt'],
        where: {
          workspaceId,
          action: { in: ['USER_LOGIN', 'USER_SIGNUP'] }, // Placeholder for AI usage
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        _count: true,
      }),
    ]);

    return {
      activeMembers,
      projectCount,
      storageUsed: fileAssets._sum.size || 0,
      aiDailyRequests: aiUsage.reduce((sum, group) => sum + group._count, 0),
      aiDailyTokens: 0, // TODO: Implement actual AI token tracking
    };
  }

  /**
   * Parse plan limits from JSON
   */
  private parsePlanLimits(limits: Prisma.JsonObject | null): PlanLimits {
    if (!limits) {
      return DEFAULT_FREE_PLAN;
    }

    return {
      seats: (limits.seats as number) || DEFAULT_FREE_PLAN.seats,
      projects: (limits.projects as number) || DEFAULT_FREE_PLAN.projects,
      storage: (limits.storage as number) || DEFAULT_FREE_PLAN.storage,
      aiQuota: {
        dailyRequests: (limits.aiQuota as any)?.dailyRequests || DEFAULT_FREE_PLAN.aiQuota.dailyRequests,
        dailyTokens: (limits.aiQuota as any)?.dailyTokens || DEFAULT_FREE_PLAN.aiQuota.dailyTokens,
      },
      features: (limits.features as Record<string, boolean>) || DEFAULT_FREE_PLAN.features,
    };
  }

  /**
   * Merge plan limits with overrides
   */
  private mergeLimits(base: PlanLimits, overrides: Prisma.JsonObject): PlanLimits {
    const merged = { ...base };

    if (overrides.seats !== undefined) merged.seats = overrides.seats as number;
    if (overrides.projects !== undefined) merged.projects = overrides.projects as number;
    if (overrides.storage !== undefined) merged.storage = overrides.storage as number;
    if (overrides.aiQuota) {
      merged.aiQuota = {
        ...merged.aiQuota,
        ...(overrides.aiQuota as any),
      };
    }
    if (overrides.features) {
      merged.features = {
        ...merged.features,
        ...(overrides.features as Record<string, boolean>),
      };
    }

    return merged;
  }

  /**
   * Create or update a plan
   */
  async upsertPlan(
    key: string,
    data: {
      name: string;
      limits: PlanLimits;
    },
  ) {
    return this.prisma.plan.upsert({
      where: { key },
      create: {
        key,
        name: data.name,
        limits: data.limits as unknown as Prisma.JsonObject,
      },
      update: {
        name: data.name,
        limits: data.limits as unknown as Prisma.JsonObject,
      },
    });
  }

  /**
   * Assign entitlement to workspace
   */
  async assignEntitlement(
    workspaceId: string,
    planKey: string,
    overrides?: Partial<PlanLimits>,
    effectiveFrom?: Date,
    effectiveTo?: Date,
  ) {
    const plan = await this.prisma.plan.findUnique({ where: { key: planKey } });
    if (!plan) {
      throw new ForbiddenException(`Plan ${planKey} not found`);
    }

    return this.prisma.entitlement.create({
      data: {
        workspaceId,
        planId: plan.id,
        effectiveFrom: effectiveFrom || new Date(),
        effectiveTo,
        overrides: overrides as Prisma.JsonObject,
      },
    });
  }

  /**
   * List all plans
   */
  async listPlans() {
    return this.prisma.plan.findMany({
      include: { entitlements: { take: 5 } },
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get plan by key
   */
  async getPlan(key: string) {
    return this.prisma.plan.findUnique({
      where: { key },
      include: { entitlements: true },
    });
  }
}
