import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Response } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserStatus, WorkspaceStatus, WorkspaceMemberStatus, AuditAction } from '@prisma/client';

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
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

  async register(dto: RegisterDto, meta?: RequestMeta, res?: Response) {
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

    const tokens = await this.generateTokens(result.user.id, result.user.email);

    if (res) {
      this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    await this.auditLogService.log({
      actorId: result.user.id,
      action: AuditAction.USER_SIGNUP,
      targetType: 'User',
      targetId: result.user.id,
      workspaceId: result.workspace.id,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { email: result.user.email },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.profile?.firstName || dto.firstName,
        lastName: result.user.profile?.lastName || dto.lastName,
        isEmailVerified: result.user.isEmailVerified,
        workspaces: [
          {
            id: result.workspace.id,
            name: result.workspace.name,
            slug: result.workspace.slug,
            type: result.workspace.type,
            role: 'OWNER',
          },
        ],
      },
      tokens,
    };
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

    // Revoke used token for rotation security
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

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

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: resetRecord.userId },
        data: { isRevoked: true },
      }),
    ]);

    await this.auditLogService.log({
      actorId: resetRecord.userId,
      action: AuditAction.USER_PASSWORD_RESET,
      targetType: 'User',
      targetId: resetRecord.userId,
      requestId: meta?.requestId,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return {
      message: 'Password reset successfully. You may now sign in.',
    };
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
