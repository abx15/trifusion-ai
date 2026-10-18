import { ExecutionContext, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceGuard } from './workspace.guard';
import { PlatformRolesGuard } from './platform-roles.guard';
import { JwtStrategy } from '../strategies/jwt.strategy';

import { ConfigService } from '@nestjs/config';
import { WorkspaceRole, UserStatus } from "@prisma/client";
import { runSeed } from '../../../../../../database/seeds/seed';

describe('Phase 2 Mandatory Security Suites', () => {
  let workspaceGuard: WorkspaceGuard;
  let platformRolesGuard: PlatformRolesGuard;
  let jwtStrategy: JwtStrategy;
  let reflector: Reflector;
  let mockPolicyService: any;
  let mockConfigService: any;

  beforeEach(() => {
    reflector = new Reflector();
    mockPolicyService = {
      resolveUser: jest.fn(),
      getWorkspaceContext: jest.fn(),
      getPlatformStaffContext: jest.fn(),
      requireWorkspaceRole: jest.fn(),
      requirePlatformRole: jest.fn(),
      validateRoleChange: jest.fn(),
      validateMemberRemoval: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'auth.secret') return 'test_super_secret_key_32_chars_long!';
        return null;
      }),
    };

    workspaceGuard = new WorkspaceGuard(reflector, mockPolicyService);
    platformRolesGuard = new PlatformRolesGuard(reflector, mockPolicyService);
    jwtStrategy = new JwtStrategy(mockConfigService as ConfigService, mockPolicyService);
  });

  function createMockExecutionContext(req: any, handler?: any, targetClass?: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({} as any),
        getNext: () => (() => {}) as any,
      }),
      getHandler: () => (handler || (() => {})) as any,
      getClass: () => (targetClass || class TestClass {}) as any,
      getArgs: () => [] as any[],
      getArgByIndex: () => ({} as any),
      switchToRpc: () => ({}) as any,
      switchToWs: () => ({}) as any,
      getType: () => 'http' as any,
    } as ExecutionContext;
  }

  // =========================================================================
  // 1. Cross-Tenant IDOR & Unauthorized Workspace Switching
  // =========================================================================
  describe('Security: Cross-Tenant IDOR & Spoofed Workspace Identification', () => {
    it('should reject when user attempts to access workspace B where they have no membership', async () => {
      const req = {
        user: { id: 'user-tenant-a', email: 'a@example.com' },
        params: { workspaceId: 'workspace-b' },
        headers: {},
      };

      mockPolicyService.getWorkspaceContext.mockRejectedValueOnce(
        new ForbiddenException('You do not have active access to this workspace'),
      );

      const ctx = createMockExecutionContext(req);
      await expect(workspaceGuard.canActivate(ctx)).rejects.toThrow(
        'You do not have active access to this workspace',
      );
    });

    it('should reject request when workspaceId is omitted completely from headers/params/body', async () => {
      const req = {
        user: { id: 'user-tenant-a', email: 'a@example.com' },
        params: {},
        headers: {},
      };

      const ctx = createMockExecutionContext(req);
      await expect(workspaceGuard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    });

    it('should ignore client-supplied roles and strictly resolve role server-side from database', async () => {
      const req = {
        user: { id: 'user-tenant-a', email: 'a@example.com' },
        params: { workspaceId: 'workspace-a' },
        headers: {},
        body: { role: 'OWNER' }, // Forged role in body
      };

      mockPolicyService.getWorkspaceContext.mockResolvedValueOnce({
        workspaceId: 'workspace-a',
        workspaceName: 'Acme',
        role: WorkspaceRole.VIEWER, // Real database role is VIEWER
        membershipId: 'mem-1',
      });

      const ctx = createMockExecutionContext(req);
      await workspaceGuard.canActivate(ctx);

      // Verify that request.workspace.role reflects DB, ignoring client body
      expect((req as any)['workspace'].role).toBe(WorkspaceRole.VIEWER);
    });
  });

  // =========================================================================
  // 2. Inactive, Suspended and Deleted Users Rejected on Every Request
  // =========================================================================
  describe('Security: Inactive, Suspended and Deleted User Invariants', () => {
    it('should reject valid JWT payload if user account status is SUSPENDED in DB', async () => {
      mockPolicyService.resolveUser.mockRejectedValueOnce(
        new UnauthorizedException('Account is suspended. Access denied.'),
      );

      await expect(
        jwtStrategy.validate({ sub: 'user-suspended-id', email: 'suspended@example.com' }),
      ).rejects.toThrow('Account is suspended. Access denied.');
    });

    it('should reject valid JWT payload if user account status is DELETED in DB', async () => {
      mockPolicyService.resolveUser.mockRejectedValueOnce(
        new UnauthorizedException('Account is deleted. Access denied.'),
      );

      await expect(
        jwtStrategy.validate({ sub: 'user-deleted-id', email: 'deleted@example.com' }),
      ).rejects.toThrow('Account is deleted. Access denied.');
    });

    it('should allow valid JWT payload if user account status is ACTIVE in DB', async () => {
      mockPolicyService.resolveUser.mockResolvedValueOnce({
        id: 'user-active-id',
        email: 'active@example.com',
        status: UserStatus.ACTIVE,
      });

      const res = await jwtStrategy.validate({
        sub: 'user-active-id',
        email: 'active@example.com',
      });
      expect(res.id).toBe('user-active-id');
      expect((res as any).status).toBe(UserStatus.ACTIVE);
    });
  });

  // =========================================================================
  // 3. Immediate Effect of Membership Revocation
  // =========================================================================
  describe('Security: Immediate Effect of Membership Revocation', () => {
    it('should reject subsequent request immediately when membership has been deleted or suspended', async () => {
      const req = {
        user: { id: 'revoked-user-id', email: 'revoked@example.com' },
        params: { workspaceId: 'ws-target' },
        headers: {},
      };

      // Even if user still has a valid 15-minute access token, guard checks DB:
      mockPolicyService.getWorkspaceContext.mockRejectedValueOnce(
        new ForbiddenException('You do not have active access to this workspace'),
      );

      const ctx = createMockExecutionContext(req);
      await expect(workspaceGuard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  // =========================================================================
  // 4. Platform Roles vs Workspace Roles Separation
  // =========================================================================
  describe('Security: Platform Roles vs Workspace Roles Isolation', () => {
    it('should forbid customer workspace OWNER from accessing platform staff routes', async () => {
      const req = {
        user: { id: 'workspace-owner-id', email: 'owner@customer.com' },
      };

      // Owner has no record in PlatformStaffRole table
      mockPolicyService.getPlatformStaffContext.mockResolvedValueOnce(null);

      const ctx = createMockExecutionContext(req);
      await expect(platformRolesGuard.canActivate(ctx)).rejects.toThrow(
        'Platform staff access required. Customer accounts cannot access platform controls.',
      );
    });

    it('should prevent Platform Admin from accessing customer workspace without active membership', async () => {
      const req = {
        user: { id: 'platform-admin-id', email: 'admin@trifusion.dev' },
        params: { workspaceId: 'customer-private-workspace' },
        headers: {},
      };

      // Platform admin has no membership in customer workspace
      mockPolicyService.getWorkspaceContext.mockRejectedValueOnce(
        new ForbiddenException('You do not have active access to this workspace'),
      );

      const ctx = createMockExecutionContext(req);
      await expect(workspaceGuard.canActivate(ctx)).rejects.toThrow(
        'You do not have active access to this workspace',
      );
    });
  });

  // =========================================================================
  // 5. Seed Script Refuses to Run in Production
  // =========================================================================
  describe('Security: Seed Script Production Guard', () => {
    it('should throw critical security violation when NODE_ENV is set to production', async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        await expect(runSeed()).rejects.toThrow(
          'SECURITY VIOLATION: Seed scripts are forbidden in production environment.',
        );
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});
