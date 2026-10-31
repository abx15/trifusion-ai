import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PolicyService } from '../../common/policy/policy.service';
import { WORKSPACE_ROLE_KEY } from '../auth/decorators/authorization.decorators';
import { WorkspaceRole } from '@prisma/client';
import { SetMetadata } from '@nestjs/common';

export const AI_CAPABILITY_KEY = 'ai_capability';

export const RequireAiCapability = (capability: string) =>
  SetMetadata(AI_CAPABILITY_KEY, capability);

@Injectable()
export class AiGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policyService: PolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User authentication is required for AI access');
    }

    const workspaceId =
      request.params?.workspaceId ||
      (request.headers['x-workspace-id'] as string) ||
      request.body?.workspace_id;

    if (!workspaceId) {
      throw new BadRequestException('Workspace ID is required for AI access');
    }

    const workspaceContext = await this.policyService.getWorkspaceContext(user.id, workspaceId);

    const requiredRole = this.reflector.getAllAndOverride<WorkspaceRole>(WORKSPACE_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRole) {
      const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
        VIEWER: 1,
        MEMBER: 2,
        TEAM_ADMIN: 3,
        OWNER: 4,
      };
      if (ROLE_HIERARCHY[workspaceContext.role] < ROLE_HIERARCHY[requiredRole]) {
        throw new ForbiddenException(
          `Insufficient permissions in workspace. Required: ${requiredRole}, Your role: ${workspaceContext.role}`,
        );
      }
    }

    const requiredCapability = this.reflector.getAllAndOverride<string>(AI_CAPABILITY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredCapability) {
      const allowedRoles: WorkspaceRole[] = [
        WorkspaceRole.OWNER,
        WorkspaceRole.TEAM_ADMIN,
        WorkspaceRole.MEMBER,
      ];
      if (!allowedRoles.includes(workspaceContext.role)) {
        throw new ForbiddenException(
          `AI capability '${requiredCapability}' requires OWNER, TEAM_ADMIN, or MEMBER role`,
        );
      }
    }

    request.workspace = workspaceContext;
    request.workspaceId = workspaceContext.workspaceId;
    request.aiCapability = requiredCapability;

    return true;
  }
}
