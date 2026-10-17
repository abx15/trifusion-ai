import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { WorkspaceRole, PlatformStaffRoleType } from '@prisma/client';
import { WorkspaceContext, PlatformStaffContext } from '../../../common/policy/policy.service';

export const WORKSPACE_ROLE_KEY = 'required_workspace_role';
export const PLATFORM_ROLE_KEY = 'required_platform_role';

export interface AuthenticatedRequestUser {
  id: string;
  email: string;
  status?: string;
}

/**
 * Extracts authenticated user from request (set by JwtAuthGuard / JwtStrategy).
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedRequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedRequestUser | undefined;
    return data && user ? user[data] : user;
  },
);

/**
 * Extracts verified workspace context (attached by WorkspaceGuard).
 */
export const CurrentWorkspace = createParamDecorator(
  (data: keyof WorkspaceContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const workspace = request.workspace as WorkspaceContext | undefined;
    return data && workspace ? workspace[data] : workspace;
  },
);

/**
 * Extracts verified platform staff context (attached by PlatformRolesGuard).
 */
export const CurrentPlatformStaff = createParamDecorator(
  (data: keyof PlatformStaffContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const staff = request.platformStaff as PlatformStaffContext | undefined;
    return data && staff ? staff[data] : staff;
  },
);

/**
 * Declares required minimum workspace role for route handler.
 */
export const RequireWorkspaceRole = (role: WorkspaceRole) =>
  SetMetadata(WORKSPACE_ROLE_KEY, role);

/**
 * Declares required minimum platform staff role for route handler.
 */
export const RequirePlatformRole = (role: PlatformStaffRoleType) =>
  SetMetadata(PLATFORM_ROLE_KEY, role);