import { Test, TestingModule } from '@nestjs/testing';
import { PolicyService } from './policy.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  WorkspaceRole,
  PlatformStaffRoleType,
  UserStatus,
  WorkspaceStatus,
  WorkspaceMemberStatus,
} from '@prisma/client';
import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

describe('PolicyService', () => {
  let service: PolicyService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    platformStaffRole: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PolicyService>(PolicyService);
  });

  describe('resolveUser (Account Status Invariants)', () => {
    it('should return user when user is ACTIVE', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        email: 'alice@example.com',
        status: UserStatus.ACTIVE,
      });

      const user = await service.resolveUser('u1');
      expect(user.id).toBe('u1');
      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should reject non-existent user with UnauthorizedException', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      await expect(service.resolveUser('unknown')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject SUSPENDED user on every request', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-suspended',
        email: 'suspended@example.com',
        status: UserStatus.SUSPENDED,
      });

      await expect(service.resolveUser('u-suspended')).rejects.toThrow(
        'Account is suspended. Access denied.',
      );
    });

    it('should reject DELETED user on every request', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'u-deleted',
        email: 'deleted@example.com',
        status: UserStatus.DELETED,
      });

      await expect(service.resolveUser('u-deleted')).rejects.toThrow(
        'Account is deleted. Access denied.',
      );
    });
  });

  describe('getWorkspaceContext & Multi-Tenant IDOR Guardrails', () => {
    it('should successfully resolve context for active member in active workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'm1',
        workspaceId: 'ws-1',
        userId: 'u1',
        role: WorkspaceRole.MEMBER,
        status: WorkspaceMemberStatus.ACTIVE,
        workspace: {
          id: 'ws-1',
          name: 'Acme Corp',
          status: WorkspaceStatus.ACTIVE,
        },
      });

      const ctx = await service.getWorkspaceContext('u1', 'ws-1');
      expect(ctx.workspaceId).toBe('ws-1');
      expect(ctx.role).toBe(WorkspaceRole.MEMBER);
    });

    it('should reject access (403 Forbidden) when user is NOT a member (Cross-Tenant IDOR)', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce(null);

      await expect(service.getWorkspaceContext('attacker', 'victim-ws')).rejects.toThrow(
        'You do not have active access to this workspace',
      );
    });

    it('should reject access when membership is SUSPENDED (Immediate Revocation)', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'm-revoked',
        workspaceId: 'ws-1',
        userId: 'u1',
        role: WorkspaceRole.MEMBER,
        status: WorkspaceMemberStatus.SUSPENDED,
        workspace: {
          id: 'ws-1',
          name: 'Acme Corp',
          status: WorkspaceStatus.ACTIVE,
        },
      });

      await expect(service.getWorkspaceContext('u1', 'ws-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject access when workspace is ARCHIVED or SUSPENDED', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'm1',
        workspaceId: 'ws-archived',
        userId: 'u1',
        role: WorkspaceRole.OWNER,
        status: WorkspaceMemberStatus.ACTIVE,
        workspace: {
          id: 'ws-archived',
          name: 'Old Corp',
          status: WorkspaceStatus.ARCHIVED,
        },
      });

      await expect(
        service.getWorkspaceContext('u1', 'ws-archived'),
      ).rejects.toThrow('Workspace is currently suspended or archived');
    });
  });

  describe('requireWorkspaceRole (RBAC Hierarchy)', () => {
    it('should permit access when member meets required role', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'm1',
        workspaceId: 'ws-1',
        userId: 'u1',
        role: WorkspaceRole.OWNER,
        status: WorkspaceMemberStatus.ACTIVE,
        workspace: { id: 'ws-1', name: 'Acme', status: WorkspaceStatus.ACTIVE },
      });

      const ctx = await service.requireWorkspaceRole(
        'u1',
        'ws-1',
        WorkspaceRole.TEAM_ADMIN,
      );
      expect(ctx.role).toBe(WorkspaceRole.OWNER);
    });

    it('should reject access when member has lower role than required', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'm1',
        workspaceId: 'ws-1',
        userId: 'u1',
        role: WorkspaceRole.VIEWER,
        status: WorkspaceMemberStatus.ACTIVE,
        workspace: { id: 'ws-1', name: 'Acme', status: WorkspaceStatus.ACTIVE },
      });

      await expect(
        service.requireWorkspaceRole('u1', 'ws-1', WorkspaceRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Platform Roles vs Workspace Roles Separation', () => {
    it('should reject customer user trying to access platform staff controls', async () => {
      mockPrisma.platformStaffRole.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.requirePlatformRole('customer-user', PlatformStaffRoleType.ANALYST),
      ).rejects.toThrow('Platform staff access required');
    });

    it('should allow platform staff with equal or superior platform role', async () => {
      mockPrisma.platformStaffRole.findFirst.mockResolvedValueOnce({
        id: 'staff-1',
        userId: 'staff-u',
        role: PlatformStaffRoleType.SUPERADMIN,
        status: 'ACTIVE',
      });

      const staff = await service.requirePlatformRole(
        'staff-u',
        PlatformStaffRoleType.PLATFORM_ADMIN,
      );
      expect(staff.role).toBe(PlatformStaffRoleType.SUPERADMIN);
    });

    it('should deny platform staff with insufficient platform role', async () => {
      mockPrisma.platformStaffRole.findFirst.mockResolvedValueOnce({
        id: 'staff-2',
        userId: 'staff-u',
        role: PlatformStaffRoleType.ANALYST,
        status: 'ACTIVE',
      });

      await expect(
        service.requirePlatformRole(
          'staff-u',
          PlatformStaffRoleType.PLATFORM_ADMIN,
        ),
      ).rejects.toThrow('Insufficient platform privileges');
    });
  });

  describe('Escalation Invariants: validateRoleChange', () => {
    it('should block self-role modification (Privilege Escalation attempt)', () => {
      expect(() => {
        service.validateRoleChange(
          WorkspaceRole.MEMBER,
          WorkspaceRole.MEMBER,
          WorkspaceRole.OWNER,
          true,
          1,
        );
      }).toThrow('You cannot modify your own workspace role');
    });

    it('should block TEAM_ADMIN from promoting anyone to OWNER', () => {
      expect(() => {
        service.validateRoleChange(
          WorkspaceRole.TEAM_ADMIN,
          WorkspaceRole.MEMBER,
          WorkspaceRole.OWNER,
          false,
          1,
        );
      }).toThrow('Only a workspace owner can promote a member to OWNER');
    });

    it('should block TEAM_ADMIN from demoting or altering an OWNER', () => {
      expect(() => {
        service.validateRoleChange(
          WorkspaceRole.TEAM_ADMIN,
          WorkspaceRole.OWNER,
          WorkspaceRole.MEMBER,
          false,
          2,
        );
      }).toThrow('Team admins cannot modify an OWNER role');
    });

    it('should block demoting the last remaining OWNER of a workspace', () => {
      expect(() => {
        service.validateRoleChange(
          WorkspaceRole.OWNER,
          WorkspaceRole.OWNER,
          WorkspaceRole.MEMBER,
          false,
          1, // Only 1 active owner
        );
      }).toThrow('Cannot demote the last remaining OWNER of the workspace');
    });

    it('should allow OWNER to promote a MEMBER to TEAM_ADMIN', () => {
      expect(() => {
        service.validateRoleChange(
          WorkspaceRole.OWNER,
          WorkspaceRole.MEMBER,
          WorkspaceRole.TEAM_ADMIN,
          false,
          1,
        );
      }).not.toThrow();
    });
  });

  describe('Last Owner & Removal Invariants: validateMemberRemoval', () => {
    it('should block removing the last remaining OWNER', () => {
      expect(() => {
        service.validateMemberRemoval(
          WorkspaceRole.OWNER,
          WorkspaceRole.OWNER,
          false,
          1,
        );
      }).toThrow('Cannot remove the last remaining owner of the workspace');
    });

    it('should block sole OWNER from leaving workspace without transfer', () => {
      expect(() => {
        service.validateMemberRemoval(
          WorkspaceRole.OWNER,
          WorkspaceRole.OWNER,
          true,
          1,
        );
      }).toThrow('You are the sole owner of this workspace. You must transfer ownership before leaving.');
    });

    it('should block TEAM_ADMIN from removing an OWNER', () => {
      expect(() => {
        service.validateMemberRemoval(
          WorkspaceRole.TEAM_ADMIN,
          WorkspaceRole.OWNER,
          false,
          2,
        );
      }).toThrow('Team admins cannot remove owners or other team admins');
    });

    it('should block TEAM_ADMIN from removing another TEAM_ADMIN', () => {
      expect(() => {
        service.validateMemberRemoval(
          WorkspaceRole.TEAM_ADMIN,
          WorkspaceRole.TEAM_ADMIN,
          false,
          1,
        );
      }).toThrow('Team admins cannot remove owners or other team admins');
    });

    it('should allow regular members to leave voluntarily', () => {
      expect(() => {
        service.validateMemberRemoval(
          WorkspaceRole.MEMBER,
          WorkspaceRole.MEMBER,
          true,
          1,
        );
      }).not.toThrow();
    });
  });
});
