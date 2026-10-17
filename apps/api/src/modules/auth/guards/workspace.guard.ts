import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '@prisma/client';
import { PolicyService, ROLE_HIERARCHY } from '../../../common/policy/policy.service';
import { WORKSPACE_ROLE_KEY } from '../decorators/authorization.decorators';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policyService: PolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User authentication is required for workspace access');
    }

    // Resolve workspaceId from header or route parameters
    const workspaceId =
      request.params?.workspaceId ||
      request.params?.id ||
      (request.headers['x-workspace-id'] as string) ||
      request.body?.workspaceId;

    if (!workspaceId) {
      throw new BadRequestException('Workspace ID is required (via route param :workspaceId or X-Workspace-Id header)');
    }

    // Server-side verification of active membership and active workspace status
    const workspaceContext = await this.policyService.getWorkspaceContext(user.id, workspaceId);

    // Verify role hierarchy if route specifies a minimum required role
    const requiredRole = this.reflector.getAllAndOverride<WorkspaceRole>(WORKSPACE_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRole) {
      if (ROLE_HIERARCHY[workspaceContext.role] < ROLE_HIERARCHY[requiredRole]) {
        throw new ForbiddenException(
          `Insufficient permissions in workspace. Required: ${requiredRole}, Your role: ${workspaceContext.role}`,
        );
      }
    }

    // Attach verified server-derived context
    request.workspace = workspaceContext;
    request.workspaceId = workspaceContext.workspaceId;

    return true;
  }
}