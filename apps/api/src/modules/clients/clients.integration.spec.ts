import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { configureIsolatedTestDatabase } from '../../test-database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceRole, UserStatus, WorkspaceMemberStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 3 Integration - Clients CRUD', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let memberToken: string;
  let viewerToken: string;
  let workspaceId: string;
  let ownerUserId: string;
  let memberUserId: string;
  let viewerUserId: string;

  beforeAll(async () => {
    configureIsolatedTestDatabase();
    const { TestAppModule } = await import('../../test-app.module');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/', 'ready', 'ready/'] });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    const passwordHash = await bcrypt.hash('Password123!', 12);

    const ownerUser = await prisma.user.create({
      data: {
        email: `owner-int-${Date.now()}@test.dev`,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });
    ownerUserId = ownerUser.id;

    const memberUser = await prisma.user.create({
      data: {
        email: `member-int-${Date.now()}@test.dev`,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });
    memberUserId = memberUser.id;

    const viewerUser = await prisma.user.create({
      data: {
        email: `viewer-int-${Date.now()}@test.dev`,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    });
    viewerUserId = viewerUser.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: 'Int Test Workspace',
        slug: `int-ws-${Date.now()}`,
        type: 'COMPANY',
        status: 'ACTIVE',
        ownerId: ownerUserId,
      },
    });
    workspaceId = workspace.id;

    await prisma.workspaceMember.createMany({
      data: [
        { workspaceId, userId: ownerUserId, role: WorkspaceRole.OWNER, status: WorkspaceMemberStatus.ACTIVE },
        { workspaceId, userId: memberUserId, role: WorkspaceRole.MEMBER, status: WorkspaceMemberStatus.ACTIVE },
        { workspaceId, userId: viewerUser.id, role: WorkspaceRole.VIEWER, status: WorkspaceMemberStatus.ACTIVE },
      ],
    });

    memberToken = await getAuthToken(app, memberUser.email, 'Password123!');
    viewerToken = await getAuthToken(app, viewerUser.email, 'Password123!');
  });

  afterEach(async () => {
    await prisma.task.deleteMany({ where: { workspaceId } });
    await prisma.project.deleteMany({ where: { workspaceId } });
    await prisma.client.deleteMany({ where: { workspaceId } });
    await prisma.activityEvent.deleteMany({ where: { workspaceId } });
    await prisma.workspaceMember.deleteMany({ where: { workspaceId } });
    await prisma.workspace.delete({ where: { id: workspaceId } });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerUserId, memberUserId, viewerUserId] } },
    });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should create a client as MEMBER', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/clients`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Test Client', email: 'client@test.com' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Test Client');
    expect(res.body.workspaceId).toBe(workspaceId);
    expect(res.body.status).toBe('ACTIVE');
  });

  it('should list clients with pagination', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/clients`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Client A' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/clients`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Client B' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/clients?limit=2`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(res.body.data.length).toBe(2);
    expect(res.body.hasMore).toBe(true);
    expect(res.body.nextCursor).toBeDefined();
  });

  it('should get a client by ID', async () => {
    const createRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/clients`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Get Client' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/clients/${createRes.body.id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(res.body.id).toBe(createRes.body.id);
    expect(res.body.name).toBe('Get Client');
  });

  it('should update a client as MEMBER', async () => {
    const createRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/clients`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Original Name' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceId}/clients/${createRes.body.id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Updated Name' })
      .expect(200);

    expect(res.body.name).toBe('Updated Name');
  });

  it('should reject unknown fields in create client', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/clients`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Test', unknownField: 'should be rejected' })
      .expect(400);
  });

  it('should reject VIEWER creating a client', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/clients`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Viewer Client' })
      .expect(403);
  });

  it('should reject cross-workspace access via guessed ID', async () => {
    const otherWorkspace = await prisma.workspace.create({
      data: {
        name: 'Other Workspace',
        slug: `other-ws-${Date.now()}`,
        type: 'COMPANY',
        status: 'ACTIVE',
        ownerId: ownerUserId,
      },
    });

    const otherClient = await prisma.client.create({
      data: {
        workspaceId: otherWorkspace.id,
        name: 'Other Client',
        createdBy: ownerUserId,
      },
    });

    await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/clients/${otherClient.id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(404);

    await prisma.client.delete({ where: { id: otherClient.id } });
    await prisma.workspace.delete({ where: { id: otherWorkspace.id } });
  });

  it('should archive and restore a client as TEAM_ADMIN', async () => {
    const adminUser = await prisma.user.create({
      data: {
        email: `admin-int-${Date.now()}@test.dev`,
        passwordHash: await bcrypt.hash('Password123!', 12),
        status: UserStatus.ACTIVE,
      },
    });
    const adminToken = await getAuthToken(app, adminUser.email, 'Password123!');
    await prisma.workspaceMember.create({
      data: { workspaceId, userId: adminUser.id, role: WorkspaceRole.TEAM_ADMIN, status: WorkspaceMemberStatus.ACTIVE },
    });

    const createRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/clients`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Archive Client' })
      .expect(201);

    const archiveRes = await request(app.getHttpServer())
      .delete(`/api/v1/workspaces/${workspaceId}/clients/${createRes.body.id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(archiveRes.body.status).toBe('ARCHIVED');
    expect(archiveRes.body.deletedAt).toBeDefined();

    const restoreRes = await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceId}/clients/${createRes.body.id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(restoreRes.body.status).toBe('ACTIVE');
    expect(restoreRes.body.deletedAt).toBeNull();

    await prisma.user.delete({ where: { id: adminUser.id } });
    await prisma.workspaceMember.deleteMany({ where: { userId: adminUser.id } });
  });

  it('should create activity and audit entries on client creation', async () => {
    const requestId = `client-create-${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/clients`)
      .set('X-Request-Id', requestId)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Audit Client' })
      .expect(201);

    const activities = await prisma.activityEvent.findMany({
      where: { workspaceId, entityType: 'CLIENT', entityId: response.body.id },
    });
    expect(activities.length).toBeGreaterThan(0);
    expect(activities[0].metadata).toEqual({ requestId });

    const audits = await prisma.auditLog.findMany({
      where: { workspaceId, targetType: 'Client', targetId: response.body.id },
    });
    expect(audits.length).toBeGreaterThan(0);
    expect(audits[0].requestId).toBe(requestId);
  });
});

async function getAuthToken(app: INestApplication, email: string, password: string): Promise<string> {
  const loginRes = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);
  return loginRes.body.tokens.accessToken;
}
