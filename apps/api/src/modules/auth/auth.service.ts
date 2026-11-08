import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UserStatus, WorkspaceStatus, WorkspaceMemberStatus, AuditAction } from '@prisma/client';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export interface VerificationResult {
  status: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly verificationCodeTtlMs = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateSlug(text: string): string {
    const base = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    return `${base || 'workspace'}-${randomSuffix}`;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const refreshExpiresDays = 7;
    const expiresAt = new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  private async createVerificationToken(userId: string, code: string) {
    const tokenHash = this.hashToken(code);
    const expiresAt = new Date(Date.now() + this.verificationCodeTtlMs);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return tokenHash;
  }

  private async invalidateExistingVerificationTokens(userId: string) {
    await this.prisma.emailVerificationToken.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }

  private async sendVerificationEmail(email: string, code: string) {
    if (!this.emailService.isConfigured()) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured. Contact the administrator before registering or requesting a verification code.',
      );
    }

    const subject = 'Verify your email — TriFusion AI';
    const text = `Your verification code is ${code}. It expires in 15 minutes. If you did not request this, you can safely ignore this email.`;
    await this.emailService.send(email, subject, text);
  }

  /**
   * Helper to set secure HttpOnly cookies for web browsers
   */
  setTokenCookies(res: Response, accessToken: string, refreshToken?: string) {
    const isProd = process.env.NODE_ENV === 'production';
    const sameSiteSetting = isProd ? ('strict' as const) : ('lax' as const);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSiteSetting,
      maxAge: 15 * 60 * 1000, // 15 min
      path: '/',
    });

    if (refreshToken) {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: sameSiteSetting,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }
  }

  clearTokenCookies(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    const sameSiteSetting = isProd ? ('strict' as const) : ('lax' as const);

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSiteSetting,
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: sameSiteSetting,
      path: '/',
    });
  }

  async register(dto: RegisterDto, meta?: RequestMeta, _res?: Response) {
    if (!this.emailService.isConfigured()) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured. Registration is temporarily unavailable.',
      );
    }

    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const workspaceSlug = this.generateSlug(`${dto.firstName}-${dto.lastName}`);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          status: UserStatus.ACTIVE,
          profile: {
            create: {
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
            },
          },
        },
        include: {
          profile: true,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: `${dto.firstName}'s Workspace`,
          slug: workspaceSlug,
          type: 'PERSONAL',
          status: WorkspaceStatus.ACTIVE,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
              status: WorkspaceMemberStatus.ACTIVE,
            },
          },
        },
      });

      return { user, workspace };
    });

    const verificationCode = this.generateVerificationCode();
    await this.createVerificationToken(result.user.id, verificationCode);
    await this.sendVerificationEmail(result.user.email, verificationCode);

    await this.auditLogService.log({
      actorId: result.user.id,
      action: AuditAction.USER_SIGNUP,
      targetType: 'User',
      targetId: result.user.id,
      workspaceId: result.workspace.id,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { email: result.user.email, emailVerified: false },
    });

    return {
      status: 'email_verification_pending',
      email: result.user.email,
      message: 'Account created. Please check your email for a verification code to complete registration.',
    } as VerificationResult;
  }

  async login(dto: LoginDto, meta?: RequestMeta, res?: Response) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
        workspaceMemberships: {
          where: { status: WorkspaceMemberStatus.ACTIVE },
          include: {
            workspace: true,
          },
        },
      },
    });

    // Prevent user enumeration: generic error message for non-existent, inactive, or password-less accounts
    if (!user || user.status !== UserStatus.ACTIVE || !user.passwordHash) {
      if (user) {
        await this.auditLogService.log({
          actorId: user.id,
          action: AuditAction.AUTH_LOGIN_FAILED,
          targetType: 'User',
          targetId: user.id,
          requestId: meta?.requestId,
          ip: meta?.ip,
          userAgent: meta?.userAgent,
          metadata: { email: normalizedEmail, reason: 'Inactive account or missing credentials' },
        });
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.auditLogService.log({
        actorId: user.id,
        action: AuditAction.AUTH_LOGIN_FAILED,
        targetType: 'User',
        targetId: user.id,
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { email: normalizedEmail, reason: 'Invalid password' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      await this.auditLogService.log({
        actorId: user.id,
        action: AuditAction.AUTH_LOGIN_FAILED,
        targetType: 'User',
        targetId: user.id,
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
        metadata: { email: normalizedEmail, reason: 'Email not verified' },
      });
      throw new UnauthorizedException({
        status: 'email_not_verified',
        email: user.email,
        message: 'Please verify your email before logging in.',
      } as { status: string; email: string; message: string });
    }

    const tokens = await this.generateTokens(user.id, user.email);

    if (res) {
      this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    await this.auditLogService.log({
      actorId: user.id,
      action: AuditAction.USER_LOGIN,
      targetType: 'User',
      targetId: user.id,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { email: user.email },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        isEmailVerified: user.isEmailVerified,
        avatarUrl: user.profile?.avatarUrl || null,
        workspaces: user.workspaceMemberships.map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          type: m.workspace.type,
          role: m.role,
        })),
      },
      tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto, res?: Response) {
    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (storedToken.user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is disabled');
    }

    // Atomic compare-and-set prevents two concurrent requests from rotating
    // the same refresh token successfully.
    const revoked = await this.prisma.refreshToken.updateMany({
      where: {
        id: storedToken.id,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      data: { isRevoked: true },
    });

    if (revoked.count !== 1) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new token pair
    const tokens = await this.generateTokens(storedToken.user.id, storedToken.user.email);

    if (res) {
      this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    return tokens;
  }

  async logout(userId: string, meta?: RequestMeta, res?: Response) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    if (res) {
      this.clearTokenCookies(res);
    }

    await this.auditLogService.log({
      actorId: userId,
      action: AuditAction.USER_LOGOUT,
      targetType: 'User',
      targetId: userId,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      success: true,
      message: 'Successfully logged out',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto, meta?: RequestMeta) {
    if (!this.emailService.isConfigured()) {
      throw new ServiceUnavailableException('Email delivery is not configured.');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && user.status === UserStatus.ACTIVE) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const webUrl = process.env.WEB_URL || 'http://localhost:3000';
      const resetUrl = new URL('/reset-password', webUrl);
      resetUrl.searchParams.set('token', resetToken);
      try {
        await this.emailService.send(
          user.email,
          'Reset your TriFusion AI password',
          `We received a request to reset your password. Use this link within one hour: ${resetUrl.toString()} If you did not request this, you can ignore this email.`,
        );
      } catch (error) {
        this.logger.error(
          'Password reset email delivery failed.',
          error instanceof Error ? error.stack : String(error),
        );
      }

      await this.auditLogService.log({
        actorId: user.id,
        action: AuditAction.USER_PASSWORD_FORGOT,
        targetType: 'User',
        targetId: user.id,
        requestId: meta?.requestId,
        ip: meta?.ip,
        userAgent: meta?.userAgent,
      });

      this.logger.log(`Password reset requested for user: ${user.email}`);
    }

    // Always return constant message to prevent account existence enumeration
    return {
      message: 'If the email is registered, a password reset link has been dispatched.',
    };
  }

  async resetPassword(dto: ResetPasswordDto, meta?: RequestMeta) {
    const tokenHash = this.hashToken(dto.token);
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt <= new Date()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    const now = new Date();

    // Claim the token atomically so concurrent reset requests cannot both succeed.
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: resetRecord.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException('Invalid or expired password reset token');
      }

      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      });
      await tx.refreshToken.updateMany({
        where: { userId: resetRecord.userId },
        data: { isRevoked: true },
      });
    });

    await this.auditLogService.log({
      actorId: resetRecord.userId,
      action: AuditAction.USER_PASSWORD_RESET,
      targetType: 'User',
      targetId: resetRecord.userId,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { message: 'Password reset successfully. You may now sign in.' };
  }
  async verifyEmail(dto: VerifyEmailDto, meta?: RequestMeta, res?: Response) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is disabled');
    }

    if (user.isEmailVerified) {
      const tokens = await this.generateTokens(user.id, user.email);

      if (res) {
        this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
      }

      return {
        status: 'already_verified',
        email: user.email,
        message: 'Email is already verified.',
        tokens,
      };
    }

    const tokenHash = this.hashToken(dto.code);

    const verificationRecord = await this.prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
        tokenHash,
        usedAt: null,
      },
    });

    if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    const tokens = await this.generateTokens(user.id, user.email);

    if (res) {
      this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    await this.auditLogService.log({
      actorId: user.id,
      action: AuditAction.USER_SIGNUP,
      targetType: 'User',
      targetId: user.id,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { email: user.email, emailVerified: true },
    });

    return {
      status: 'verified',
      email: user.email,
      message: 'Email verified successfully.',
      tokens,
    };
  }

  async resendVerification(dto: ResendVerificationDto, meta?: RequestMeta) {
    if (!this.emailService.isConfigured()) {
      throw new ServiceUnavailableException('Email delivery is not configured.');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const genericResponse = {
      message: 'If the email is registered and still unverified, a verification code has been sent.',
    };

    if (!user || user.status !== UserStatus.ACTIVE || user.isEmailVerified) {
      return genericResponse;
    }

    await this.invalidateExistingVerificationTokens(user.id);

    const verificationCode = this.generateVerificationCode();
    await this.createVerificationToken(user.id, verificationCode);
    await this.sendVerificationEmail(user.email, verificationCode);

    await this.auditLogService.log({
      actorId: user.id,
      action: AuditAction.USER_SIGNUP,
      targetType: 'User',
      targetId: user.id,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { email: user.email, emailVerified: false, action: 'resend_verification' },
    });

    return genericResponse;
  }

  async acceptInvitation(token: string, userId: string, meta?: RequestMeta) {
    const tokenHash = this.hashToken(token);

    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { tokenHash },
      include: {
        workspace: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation token is invalid');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(`Invitation is already ${invitation.status.toLowerCase()}`);
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation token has expired');
    }

    // Verify current user matches the invited email or associate membership
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Active account required to accept invitation');
    }

    // Upsert membership
    const membership = await this.prisma.$transaction(async (tx) => {
      const member = await tx.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId: user.id,
          },
        },
        create: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          role: invitation.role,
          status: WorkspaceMemberStatus.ACTIVE,
        },
        update: {
          role: invitation.role,
          status: WorkspaceMemberStatus.ACTIVE,
        },
      });

      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return member;
    });

    await this.auditLogService.log({
      actorId: user.id,
      action: AuditAction.INVITATION_ACCEPT,
      targetType: 'WorkspaceMember',
      targetId: membership.id,
      workspaceId: invitation.workspaceId,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { role: invitation.role },
    });

    return {
      success: true,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      role: invitation.role,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        workspaceMemberships: {
          where: { status: WorkspaceMemberStatus.ACTIVE },
          include: {
            workspace: true,
          },
        },
        platformStaffRoles: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or disabled');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      isEmailVerified: user.isEmailVerified,
      avatarUrl: user.profile?.avatarUrl || null,
      timezone: user.profile?.timezone || 'UTC',
      locale: user.profile?.locale || 'en',
      platformRoles: user.platformStaffRoles.map((r) => r.role),
      workspaces: user.workspaceMemberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        type: m.workspace.type,
        role: m.role,
      })),
    };
  }
}
