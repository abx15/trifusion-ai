import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PolicyService } from '../../common/policy/policy.service';
import { AuditLogService } from '../audit/audit.service';
import { WorkspaceRole, WorkspaceStatus, WorkspaceMemberStatus } from '@prisma/client';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('WorkspacesService', () => {
  let service: WorkspacesService;

  const mockPrisma = {
    workspace: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    workspaceMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceInvitation: {
      create: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockPolicyService = {
    resolveUser: jest.fn(),
    getWorkspaceContext: jest.fn(),
    requireWorkspaceRole: jest.fn(),
    validateRoleChange: jest.fn(),
    validateMemberRemoval: jest.fn(),
    listUserWorkspaces: jest.fn(),
  };

  const mockAuditLogService = {
    log: jest.fn().mockResolvedValue(undefined),
    findLogs: jest.fn().mockResolvedValue({ total: 0, logs: [] }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      if (typeof callback === 'function') {
        return callback(mockPrisma);
      }
      return Promise.all(callback);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PolicyService, useValue: mockPolicyService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
  });

  describe('createWorkspace', () => {
    it('should create a company workspace and set creator as OWNER', async () => {
      mockPolicyService.resolveUser.mockResolvedValueOnce({
        id: 'user-1',
        email: 'alice@example.com',
        status: 'ACTIVE',
      });

      mockPrisma.workspace.create.mockResolvedValueOnce({
        id: 'ws-new',
        name: 'Alpha Digital',
        slug: 'alpha-digital-123',
        type: 'COMPANY',
        status: WorkspaceStatus.ACTIVE,
        createdAt: new Date(),
      });

      const result = await service.createWorkspace('user-1', { name: 'Alpha Digital' });

      expect(result.id).toBe('ws-new');
      expect(result.role).toBe(WorkspaceRole.OWNER);
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'user-1',
          action: 'WORKSPACE_CREATE',
          targetId: 'ws-new',
        }),
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should call policyService.validateRoleChange and update member role', async () => {
      mockPolicyService.getWorkspaceContext.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        role: WorkspaceRole.OWNER,
      });

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        id: 'target-mem-1',
        workspaceId: 'ws-1',
        userId: 'target-user',
        role: WorkspaceRole.MEMBER,
        status: WorkspaceMemberStatus.ACTIVE,
      });

      mockPrisma.workspaceMember.count.mockResolvedValueOnce(1);
      mockPrisma.workspaceMember.update.mockResolvedValueOnce({
        id: 'target-mem-1',
        role: WorkspaceRole.TEAM_ADMIN,
      });

      const res = await service.updateMemberRole(
        'ws-1',
        'owner-user',
        'target-user',
        WorkspaceRole.TEAM_ADMIN,
      );

      expect(mockPolicyService.validateRoleChange).toHaveBeenCalledWith(
        WorkspaceRole.OWNER,
        WorkspaceRole.MEMBER,
        WorkspaceRole.TEAM_ADMIN,
        false,
        1,
      );
      expect(res.success).toBe(true);
      expect(res.role).toBe(WorkspaceRole.TEAM_ADMIN);
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MEMBER_ROLE_CHANGE' }),
      );
    });

    it('should throw if target member does not exist in workspace', async () => {
      mockPolicyService.getWorkspaceContext.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        role: WorkspaceRole.OWNER,
      });
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateMemberRole('ws-1', 'owner-user', 'stranger', WorkspaceRole.MEMBER),
      ).rejects.toThrow('Target member not found in this workspace');
    });
  });

  describe('createInvitation', () => {
    it('should disallow TEAM_ADMIN from inviting an OWNER', async () => {
      mockPolicyService.requireWorkspaceRole.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        role: WorkspaceRole.TEAM_ADMIN,
      });

      await expect(
        service.createInvitation('ws-1', 'admin-user', {
          email: 'newowner@example.com',
          role: WorkspaceRole.OWNER,
        }),
      ).rejects.toThrow('Only workspace owners can invite new owners');
    });

    it('should disallow inviting an already existing active member', async () => {
      mockPolicyService.requireWorkspaceRole.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        role: WorkspaceRole.OWNER,
      });

      mockPrisma.workspaceMember.findFirst.mockResolvedValueOnce({
        id: 'existing-mem',
      });

      await expect(
        service.createInvitation('ws-1', 'owner-user', {
          email: 'already@example.com',
          role: WorkspaceRole.MEMBER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should issue invitation token and write audit log for valid request', async () => {
      mockPolicyService.requireWorkspaceRole.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        role: WorkspaceRole.OWNER,
      });

      mockPrisma.workspaceMember.findFirst.mockResolvedValueOnce(null);
      mockPrisma.workspaceInvitation.upsert.mockResolvedValueOnce({
        id: 'inv-1',
        email: 'colleague@example.com',
        role: WorkspaceRole.MEMBER,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });

      const res = await service.createInvitation('ws-1', 'owner-user', {
        email: 'colleague@example.com',
        role: WorkspaceRole.MEMBER,
      });

      expect(res.id).toBe('inv-1');
      expect(res.invitationToken).toBeDefined();
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'INVITATION_CREATE' }),
      );
    });
  });

  describe('leaveWorkspace', () => {
    it('should block sole OWNER from leaving workspace', async () => {
      mockPolicyService.getWorkspaceContext.mockResolvedValueOnce({
        workspaceId: 'ws-1',
        role: WorkspaceRole.OWNER,
        membershipId: 'mem-1',
      });

      mockPrisma.workspaceMember.count.mockResolvedValueOnce(1); // Only 1 owner
      mockPolicyService.validateMemberRemoval.mockImplementationOnce(() => {
        throw new BadRequestException('You are the sole owner of this workspace.');
      });

      await expect(service.leaveWorkspace('ws-1', 'owner-user')).rejects.toThrow(
        'You are the sole owner of this workspace.',
      );
    });
  });
});
