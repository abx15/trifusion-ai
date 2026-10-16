import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
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
    },
    workspace: {
      create: jest.fn(),
    },
    workspaceMember: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
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

  it('should throw BadRequestException on invalid reset token', async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.resetPassword({ token: 'invalid', newPassword: 'NewPass123!' }),
    ).rejects.toThrow('Invalid or expired password reset token');
  });

  it('should return success message on logout', async () => {
    mockPrisma.refreshToken.updateMany.mockResolvedValueOnce({ count: 2 });
    const result = await service.logout('user-id');
    expect(result.success).toBe(true);
    expect(result.message).toContain('logged out');
  });

  it('should throw UnauthorizedException on disabled user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'u1', isActive: false });
    await expect(service.getMe('u1')).rejects.toThrow('User not found or disabled');
  });
});