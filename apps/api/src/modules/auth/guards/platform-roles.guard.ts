import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformStaffRoleType } from '@prisma/client';
import { PolicyService, PLATFORM_ROLE_HIERARCHY } from '../../../common/policy/policy.service';
import {
  PLATFORM_ROLE_KEY,
  PLATFORM_ROLES_KEY,
} from '../decorators/authorization.decorators';

@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policyService: PolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('Authentication required');
    }

    const staffContext = await this.policyService.getPlatformStaffContext(user.id);
    if (!staffContext) {
      throw new ForbiddenException('Platform staff access required. Customer accounts cannot access platform controls.');
    }

    const allowedRoles = this.reflector.getAllAndOverride<PlatformStaffRoleType[]>(
      PLATFORM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowedRoles && !allowedRoles.includes(staffContext.role)) {
      throw new ForbiddenException(
        `This endpoint is not available to platform role: ${staffContext.role}`,
      );
    }

    const requiredRole = this.reflector.getAllAndOverride<PlatformStaffRoleType>(
      PLATFORM_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!allowedRoles && requiredRole) {
      if (PLATFORM_ROLE_HIERARCHY[staffContext.role] < PLATFORM_ROLE_HIERARCHY[requiredRole]) {
        throw new ForbiddenException(
          `Insufficient platform privileges. Required: ${requiredRole}, Your role: ${staffContext.role}`,
        );
      }
    }

    request.platformStaff = staffContext;
    return true;
  }
}
