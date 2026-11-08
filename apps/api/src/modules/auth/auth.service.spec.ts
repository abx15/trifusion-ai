import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { UserStatus } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    workspace: {
      create: jest.fn(),
    },
    workspaceMember: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditLogService = {
    log: jest.fn().mockResolvedValue(undefined),
    findLogs: jest.fn().mockResolvedValue({ total: 0, logs: [] }),
  };
  const mockEmailService = {
    isConfigured: jest.fn().mockReturnValue(true),
    send: jest.fn().mockResolvedValue(undefined),
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
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('access-token') },
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException on duplicate email', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'existing' });
    await expect(
      service.register({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      }),
    ).rejects.toThrow('An account with this email address already exists');
  });

  it('does not reveal whether an email is registered during verification resend', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const result = await service.resendVerification({ email: 'unknown@example.com' });

    expect(result.message).toContain('If the email is registered');
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'unknown@example.com' },
    });
  });

  it('should reject registration when email delivery is not configured', async () => {
    mockEmailService.isConfigured.mockReturnValueOnce(false);

    await expect(
      service.register({
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      }),
    ).rejects.toThrow('Email delivery is not configured');
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should send a password reset link without exposing account existence', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      status: UserStatus.ACTIVE,
    });
    mockPrisma.passwordResetToken.create.mockResolvedValueOnce({ id: 'reset-1' });

    const result = await service.forgotPassword({ email: ' USER@example.com ' });

    expect(result.message).toContain('If the email is registered');
    expect(mockEmailService.send).toHaveBeenCalledWith(
      'user@example.com',
      'Reset your TriFusion AI password',
      expect.stringContaining('/reset-password?token='),
    );
  });

  it('should throw UnauthorizedException on invalid login', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.login({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('should throw UnauthorizedException on invalid refresh token', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.refreshToken({ refreshToken: 'invalid' }),
    ).rejects.toThrow('Invalid or expired refresh token');
  });

  it('should revoke a refresh token during rotation and reject its reuse', async () => {
    const storedToken = {
      id: 'refresh-1',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user-1', email: 'user@example.com', status: UserStatus.ACTIVE },
    };

    mockPrisma.refreshToken.findUnique
      .mockResolvedValueOnce(storedToken)
      .mockResolvedValueOnce({ ...storedToken, isRevoked: true });

    mockPrisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 1 });
    const rotatedTokens = await service.refreshToken({ refreshToken: 'refresh-token' });

    expect(rotatedTokens).toEqual({
      accessToken: 'access-token',
      refreshToken: expect.any(String),
    });
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'refresh-1',
        isRevoked: false,
        expiresAt: { gt: expect.any(Date) },
      },
      data: { isRevoked: true },
    });
    expect(mockPrisma.refreshToken.create).toHaveBeenCalledTimes(1);

    await expect(
      service.refreshToken({ refreshToken: 'refresh-token' }),
    ).rejects.toThrow('Invalid or expired refresh token');
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledTimes(1);
  });

  it('should reject concurrent refresh-token reuse when atomic revocation loses the race', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValueOnce({
      id: 'refresh-race',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user-1', email: 'user@example.com', status: UserStatus.ACTIVE },
    });
    mockPrisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      service.refreshToken({ refreshToken: 'refresh-token' }),
    ).rejects.toThrow('Invalid or expired refresh token');
    expect(mockPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException on invalid reset token', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.resetPassword({ token: 'invalid', newPassword: 'NewPass123!' }),
    ).rejects.toThrow('Invalid or expired password reset token');
  });

  it('should atomically consume a valid password reset token', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user-1' },
    });
    mockPrisma.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 1 });
    mockPrisma.user.update.mockResolvedValueOnce({ id: 'user-1' });
    mockPrisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 2 });

    await expect(service.resetPassword({ token: 'valid-token', newPassword: 'NewPass123!' })).resolves.toEqual({
      message: 'Password reset successfully. You may now sign in.',
    });
    expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: 'reset-1', usedAt: null, expiresAt: expect.any(Object) }),
      data: { usedAt: expect.any(Date) },
    });
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });

  it('rejects a password reset token already claimed by another request', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce({
      id: 'reset-1',
      userId: 'user-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { id: 'user-1' },
    });
    mockPrisma.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(service.resetPassword({ token: 'valid-token', newPassword: 'NewPass123!' })).rejects.toThrow(
      'Invalid or expired password reset token',
    );
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });
  it('should return success message on logout', async () => {
    mockPrisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 2 });
    const result = await service.logout('user-id');
    expect(result.success).toBe(true);
    expect(result.message).toContain('logged out');
  });

  it('should throw UnauthorizedException on disabled user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', status: UserStatus.SUSPENDED });
    await expect(service.getMe('u1')).rejects.toThrow('User not found or disabled');
  });
});