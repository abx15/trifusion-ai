import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppModule } from '../../app.module';
import { PlatformStaffRoleType, UserStatus, WorkspaceStatus } from '@prisma/client';

describe('Platform Authorization Matrix Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let superadminToken: string;
  let platformAdminToken: string;
  let analystToken: string;
  let regularUserToken: string;
  let suspendedStaffToken: string;

  let superadminId: string;
  let platformAdminId: string;
  let analystId: string;
  let regularUserId: string;
  let suspendedStaffId: string;

  let testWorkspaceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Cleanup any existing test data
    await prisma.platformStaffRole.deleteMany({
      where: { user: { email: { contains: 'platform-test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'platform-test' } },
    });

    // Create test users
    const superadmin = await prisma.user.create({
      data: {
        email: 'superadmin-platform-test@example.com',
        passwordHash: 'hashed',
        status: UserStatus.ACTIVE,
        profile: {
          create: { firstName: 'Super', lastName: 'Admin' },
        },
      },
    });
    superadminId = superadmin.id;

    const platformAdmin = await prisma.user.create({
      data: {
        email: 'platform-admin-platform-test@example.com',
        passwordHash: 'hashed',
        status: UserStatus.ACTIVE,
        profile: {
          create: { firstName: 'Platform', lastName: 'Admin' },
        },
      },
    });
    platformAdminId = platformAdmin.id;

    const analyst = await prisma.user.create({
      data: {
        email: 'analyst-platform-test@example.com',
        passwordHash: 'hashed',
        status: UserStatus.ACTIVE,
        profile: {
          create: { firstName: 'Analyst', lastName: 'User' },
        },
      },
    });
    analystId = analyst.id;

    const regularUser = await prisma.user.create({
      data: {
        email: 'regular-platform-test@example.com',
        passwordHash: 'hashed',
        status: UserStatus.ACTIVE,
        profile: {
          create: { firstName: 'Regular', lastName: 'User' },
        },
      },
    });
    regularUserId = regularUser.id;

    const suspendedStaff = await prisma.user.create({
      data: {
        email: 'suspended-platform-test@example.com',
        passwordHash: 'hashed',
        status: UserStatus.ACTIVE,
        profile: {
          create: { firstName: 'Suspended', lastName: 'Staff' },
        },
      },
    });
    suspendedStaffId = suspendedStaff.id;

    // Assign platform roles
    await prisma.platformStaffRole.create({
      data: {
        userId: superadminId,
        role: PlatformStaffRoleType.SUPERADMIN,
        status: 'ACTIVE',
        grantedBy: 'system',
      },
    });

    await prisma.platformStaffRole.create({
      data: {
        userId: platformAdminId,
        role: PlatformStaffRoleType.PLATFORM_ADMIN,
        status: 'ACTIVE',
        grantedBy: superadminId,
      },
    });

    await prisma.platformStaffRole.create({
      data: {
        userId: analystId,
        role: PlatformStaffRoleType.ANALYST,
        status: 'ACTIVE',
        grantedBy: superadminId,
      },
    });

    await prisma.platformStaffRole.create({
      data: {
        userId: suspendedStaffId,
        role: PlatformStaffRoleType.PLATFORM_ADMIN,
        status: 'SUSPENDED',
        grantedBy: superadminId,
      },
    });

    // Create test workspace for regular user
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace-platform-test',
        type: 'PERSONAL',
        status: WorkspaceStatus.ACTIVE,
        ownerId: regularUserId,
      },
    });
    testWorkspaceId = workspace.id;

    // Create real JWT tokens for test users
    const jwtService = moduleFixture.get<JwtService>(JwtService);
    superadminToken = jwtService.sign({ sub: superadminId, email: 'superadmin-platform-test@example.com' });
    platformAdminToken = jwtService.sign({ sub: platformAdminId, email: 'platform-admin-platform-test@example.com' });
    analystToken = jwtService.sign({ sub: analystId, email: 'analyst-platform-test@example.com' });
    regularUserToken = jwtService.sign({ sub: regularUserId, email: 'regular-platform-test@example.com' });
    suspendedStaffToken = jwtService.sign({ sub: suspendedStaffId, email: 'suspended-platform-test@example.com' });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.platformStaffRole.deleteMany({
      where: { user: { email: { contains: 'platform-test' } } },
    });
    await prisma.workspace.deleteMany({
      where: { slug: { contains: 'platform-test' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'platform-test' } },
    });

    await app.close();
  });

  describe('GET /platform/v1/me - Staff context inspection', () => {
    it('should allow SUPERADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/platform/v1/me')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);
    });

    it('should allow PLATFORM_ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/platform/v1/me')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .expect(200);
    });

    it('should allow ANALYST', async () => {
      const response = await request(app.getHttpServer())
        .get('/platform/v1/me')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);
    });

    it('should deny regular user (no platform role)', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/me')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should deny suspended staff', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/me')
        .set('Authorization', `Bearer ${suspendedStaffToken}`)
        .expect(403);
    });

    it('should deny unauthenticated', async () => {
      await request(app.getHttpServer()).get('/platform/v1/me').expect(401);
    });
  });

  describe('GET /platform/v1/health - Platform health', () => {
    it('should allow SUPERADMIN', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/health')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);
    });

    it('should allow PLATFORM_ADMIN', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/health')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .expect(200);
    });

    it('should deny ANALYST (below PLATFORM_ADMIN)', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/health')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(403);
    });

    it('should deny regular user', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/health')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe('GET /platform/v1/metrics - Platform metrics', () => {
    it('should allow SUPERADMIN', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/metrics')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);
    });

    it('should allow PLATFORM_ADMIN', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/metrics')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .expect(200);
    });

    it('should allow ANALYST', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/metrics')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);
    });

    it('should deny regular user', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/metrics')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe('GET /platform/v1/audit-logs - Audit log search', () => {
    it('should allow SUPERADMIN', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/audit-logs')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);
    });

    it('should allow PLATFORM_ADMIN', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/audit-logs')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .expect(200);
    });

    it('should allow ANALYST', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/audit-logs')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200);
    });

    it('should deny regular user', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/audit-logs')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe('GET /platform/v1/audit/integrity - Audit integrity check', () => {
    it('should allow SUPERADMIN', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/audit/integrity')
        .set('Authorization', `Bearer ${superadminToken}`)
        .expect(200);
    });

    it('should deny PLATFORM_ADMIN (below SUPERADMIN)', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/audit/integrity')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .expect(403);
    });

    it('should deny ANALYST', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/audit/integrity')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(403);
    });
  });

  describe('POST /platform/v1/staff-roles - Assign staff role', () => {
    it('should allow SUPERADMIN', async () => {
      await request(app.getHttpServer())
        .post('/platform/v1/staff-roles')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          userId: regularUserId,
          role: PlatformStaffRoleType.ANALYST,
          reason: 'Test assignment',
        })
        .expect(201);
    });

    it('should deny PLATFORM_ADMIN (below SUPERADMIN)', async () => {
      await request(app.getHttpServer())
        .post('/platform/v1/staff-roles')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({
          userId: regularUserId,
          role: PlatformStaffRoleType.ANALYST,
          reason: 'Test assignment',
        })
        .expect(403);
    });

    it('should deny ANALYST', async () => {
      await request(app.getHttpServer())
        .post('/platform/v1/staff-roles')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          userId: regularUserId,
          role: PlatformStaffRoleType.ANALYST,
          reason: 'Test assignment',
        })
        .expect(403);
    });
  });

  describe('DELETE /platform/v1/staff-roles/:id - Revoke staff role', () => {
    it('should allow SUPERADMIN', async () => {
      const staffRole = await prisma.platformStaffRole.findFirst({
        where: { userId: regularUserId },
      });

      if (staffRole) {
        await request(app.getHttpServer())
          .delete(`/platform/v1/staff-roles/${staffRole.id}`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send({ reason: 'Test revocation' })
          .expect(200);
      }
    });

    it('should deny PLATFORM_ADMIN', async () => {
      const staffRole = await prisma.platformStaffRole.findFirst({
        where: { userId: platformAdminId },
      });

      if (staffRole) {
        await request(app.getHttpServer())
          .delete(`/platform/v1/staff-roles/${staffRole.id}`)
          .set('Authorization', `Bearer ${platformAdminToken}`)
          .send({ reason: 'Test revocation' })
          .expect(403);
      }
    });
  });

  describe('POST /platform/v1/feature-flags - Create/update flag', () => {
    it('should allow SUPERADMIN', async () => {
      await request(app.getHttpServer())
        .post('/platform/v1/feature-flags')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          key: 'test-flag',
          description: 'Test flag',
          type: 'boolean',
          defaultValue: 'false',
          status: 'ACTIVE',
          reason: 'Test flag creation',
        })
        .expect(201);
    });

    it('should deny PLATFORM_ADMIN (below SUPERADMIN)', async () => {
      await request(app.getHttpServer())
        .post('/platform/v1/feature-flags')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({
          key: 'test-flag-2',
          description: 'Test flag 2',
          type: 'boolean',
          defaultValue: 'false',
          status: 'ACTIVE',
          reason: 'Test flag creation',
        })
        .expect(403);
    });
  });

  describe('POST /platform/v1/grants - Request privileged access grant', () => {
    it('should allow PLATFORM_ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/platform/v1/grants')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({
          targetWorkspaceId: testWorkspaceId,
          reason: 'Support investigation',
          scope: 'read:aggregate',
        })
        .expect(201);
    });

    it('should allow SUPERADMIN', async () => {
      await prisma.privilegedAccessGrant.deleteMany({
        where: { targetWorkspaceId: testWorkspaceId },
      });
      await request(app.getHttpServer())
        .post('/platform/v1/grants')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({
          targetWorkspaceId: testWorkspaceId,
          reason: 'Support investigation',
          scope: 'read:aggregate',
        })
        .expect(201);
    });

    it('should deny ANALYST (below PLATFORM_ADMIN)', async () => {
      await request(app.getHttpServer())
        .post('/platform/v1/grants')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          targetWorkspaceId: testWorkspaceId,
          reason: 'Support investigation',
          scope: 'read:aggregate',
        })
        .expect(403);
    });

    it('should deny regular user', async () => {
      await request(app.getHttpServer())
        .post('/platform/v1/grants')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          targetWorkspaceId: testWorkspaceId,
          reason: 'Support investigation',
          scope: 'read:aggregate',
        })
        .expect(403);
    });
  });

  describe('Role escalation prevention', () => {
    it('should prevent regular user from accessing platform endpoints', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/health')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should prevent ANALYST from staff role management', async () => {
      await request(app.getHttpServer())
        .post('/platform/v1/staff-roles')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          userId: regularUserId,
          role: PlatformStaffRoleType.ANALYST,
          reason: 'Self-escalation attempt',
        })
        .expect(403);
    });

    it('should prevent PLATFORM_ADMIN from flag management', async () => {
      await request(app.getHttpServer())
        .post('/platform/v1/feature-flags')
        .set('Authorization', `Bearer ${platformAdminToken}`)
        .send({
          key: 'escalation-attempt',
          description: 'Escalation attempt',
          type: 'boolean',
          defaultValue: 'false',
          status: 'ACTIVE',
          reason: 'Escalation attempt',
        })
        .expect(403);
    });
  });

  describe('Last SUPERADMIN protection', () => {
    it('should prevent revoking the last SUPERADMIN', async () => {
      const superadminRole = await prisma.platformStaffRole.findFirst({
        where: { userId: superadminId, role: PlatformStaffRoleType.SUPERADMIN },
      });

      if (superadminRole) {
        const response = await request(app.getHttpServer())
          .delete(`/platform/v1/staff-roles/${superadminRole.id}`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send({ reason: 'Attempting to revoke last SUPERADMIN' });

        // Should return 400 Bad Request or 403
        expect([400, 403]).toContain(response.status);
      }
    });
  });

  describe('Suspended staff access', () => {
    it('should deny suspended staff from platform endpoints', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/me')
        .set('Authorization', `Bearer ${suspendedStaffToken}`)
        .expect(403);
    });

    it('should deny suspended staff from health endpoint', async () => {
      await request(app.getHttpServer())
        .get('/platform/v1/health')
        .set('Authorization', `Bearer ${suspendedStaffToken}`)
        .expect(403);
    });
  });
});
