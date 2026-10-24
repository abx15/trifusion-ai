import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface FlagEvaluationContext {
  workspaceId?: string;
  planId?: string;
  userId?: string;
}

export interface FlagEvaluationResult {
  key: string;
  value: unknown;
  enabled: boolean;
  source: 'default' | 'global' | 'plan' | 'workspace' | 'user' | 'killed';
}

const FLAG_CACHE_TTL_SECONDS = 60;

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);
  private cache: Map<string, { value: FlagEvaluationResult; expiresAt: number }> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluate a feature flag with context
   */
  async evaluate(key: string, context: FlagEvaluationContext = {}): Promise<FlagEvaluationResult> {
    const cacheKey = this.buildCacheKey(key, context);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    const flag = await this.prisma.featureFlag.findUnique({
      where: { key },
      include: { changes: true },
    });

    if (!flag) {
      this.logger.warn(`Feature flag ${key} not found, returning default`);
      return {
        key,
        value: null,
        enabled: false,
        source: 'default',
      };
    }

    // Kill switch - flag is disabled regardless of rules
    if (flag.status === 'KILLED') {
      this.logger.warn(`Feature flag ${key} is KILLED`);
      const result: FlagEvaluationResult = {
        key,
        value: this.parseValue(flag.defaultValue, flag.type),
        enabled: false,
        source: 'killed',
      };
      this.setCache(cacheKey, result);
      return result;
    }

    // Disabled flag - return default value
    if (flag.status === 'DISABLED') {
      const result: FlagEvaluationResult = {
        key,
        value: this.parseValue(flag.defaultValue, flag.type),
        enabled: false,
        source: 'default',
      };
      this.setCache(cacheKey, result);
      return result;
    }

    // Evaluate targeting rules
    const rules = flag.rules as Prisma.JsonObject;
    const evaluation = this.evaluateRules(rules, context, flag);

    this.setCache(cacheKey, evaluation);
    return evaluation;
  }

  /**
   * Evaluate targeting rules in order
   */
  private evaluateRules(
    rules: Prisma.JsonObject | null,
    context: FlagEvaluationContext,
    flag: any,
  ): FlagEvaluationResult {
    if (!rules) {
      return {
        key: flag.key,
        value: this.parseValue(flag.defaultValue, flag.type),
        enabled: this.parseValue(flag.defaultValue, flag.type) === true,
        source: 'default',
      };
    }

    const rulesArray = rules.rules as Array<{ type: string; value: unknown; enabled: boolean }>;

    if (!rulesArray || rulesArray.length === 0) {
      return {
        key: flag.key,
        value: this.parseValue(flag.defaultValue, flag.type),
        enabled: this.parseValue(flag.defaultValue, flag.type) === true,
        source: 'default',
      };
    }

    // Evaluate rules in order: global -> plan -> workspace -> user
    for (const rule of rulesArray) {
      if (!rule.enabled) continue;

      if (rule.type === 'global') {
        return {
          key: flag.key,
          value: this.parseValue(String(rule.value), flag.type),
          enabled: this.parseValue(String(rule.value), flag.type) === true,
          source: 'global',
        };
      }

      if (rule.type === 'plan' && context.planId && String(rule.value) === context.planId) {
        return {
          key: flag.key,
          value: this.parseValue(String(rule.value), flag.type),
          enabled: this.parseValue(String(rule.value), flag.type) === true,
          source: 'plan',
        };
      }

      if (rule.type === 'workspace' && context.workspaceId && String(rule.value) === context.workspaceId) {
        return {
          key: flag.key,
          value: this.parseValue(String(rule.value), flag.type),
          enabled: this.parseValue(String(rule.value), flag.type) === true,
          source: 'workspace',
        };
      }

      if (rule.type === 'user' && context.userId && String(rule.value) === context.userId) {
        return {
          key: flag.key,
          value: this.parseValue(String(rule.value), flag.type),
          enabled: this.parseValue(String(rule.value), flag.type) === true,
          source: 'user',
        };
      }
    }

    // No matching rule, return default
    return {
      key: flag.key,
      value: this.parseValue(flag.defaultValue, flag.type),
      enabled: this.parseValue(flag.defaultValue, flag.type) === true,
      source: 'default',
    };
  }

  /**
   * Parse value based on flag type
   */
  private parseValue(value: string | null, type: string): unknown {
    if (value === null) return null;

    switch (type) {
      case 'boolean':
        return value === 'true';
      case 'number':
        return parseFloat(value);
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      default:
        return value;
    }
  }

  /**
   * Build tenant-safe cache key
   */
  private buildCacheKey(key: string, context: FlagEvaluationContext): string {
    return `flag:${key}:workspace:${context.workspaceId || 'none'}:plan:${context.planId || 'none'}:user:${context.userId || 'none'}`;
  }

  /**
   * Get from cache if not expired
   */
  private getFromCache(key: string): FlagEvaluationResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  /**
   * Set cache with TTL
   */
  private setCache(key: string, value: FlagEvaluationResult): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + FLAG_CACHE_TTL_SECONDS * 1000,
    });
  }

  /**
   * Invalidate cache for a flag key
   */
  invalidateCache(key: string): void {
    const keysToDelete: string[] = [];
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(`flag:${key}:`)) {
        keysToDelete.push(cacheKey);
      }
    }
    keysToDelete.forEach((k) => this.cache.delete(k));
  }

  /**
   * Create or update a feature flag
   */
  async upsertFlag(
    key: string,
    data: {
      description?: string;
      type?: string;
      defaultValue?: string;
      rules?: Prisma.JsonObject;
      status?: string;
    },
    actorId: string,
    reason: string,
  ) {
    const existing = await this.prisma.featureFlag.findUnique({ where: { key } });

    const flag = await this.prisma.featureFlag.upsert({
      where: { key },
      create: {
        key,
        description: data.description,
        type: data.type || 'boolean',
        defaultValue: data.defaultValue,
        rules: data.rules,
        status: data.status || 'ACTIVE',
        updatedBy: actorId,
      },
      update: {
        description: data.description,
        type: data.type,
        defaultValue: data.defaultValue,
        rules: data.rules,
        status: data.status,
        updatedBy: actorId,
      },
    });

    // Record change history
    await this.prisma.featureFlagChange.create({
      data: {
        flagId: flag.id,
        actorId,
        reason,
        before: existing ? { value: existing.defaultValue, status: existing.status } as Prisma.JsonObject : Prisma.JsonNull,
        after: { value: flag.defaultValue, status: flag.status } as Prisma.JsonObject,
      },
    });

    // Invalidate cache
    this.invalidateCache(key);

    return flag;
  }

  /**
   * List all feature flags
   */
  async listFlags() {
    return this.prisma.featureFlag.findMany({
      include: { changes: { orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get flag by key with change history
   */
  async getFlag(key: string) {
    return this.prisma.featureFlag.findUnique({
      where: { key },
      include: { changes: { orderBy: { createdAt: 'desc' } } },
    });
  }
}
