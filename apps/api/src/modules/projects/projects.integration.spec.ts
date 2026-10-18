import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { configureIsolatedTestDatabase } from '../../test-database';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  WorkspaceRole,
  UserStatus,
  WorkspaceMemberStatus,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('Phase 3 Integration - Projects and Tasks', () => {
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
      data: { email: `pt-owner-${Date.now()}@test.dev`, passwordHash, status: UserStatus.ACTIVE },
    });
    ownerUserId = ownerUser.id;

    const memberUser = await prisma.user.create({
      data: { email: `pt-member-${Date.now()}@test.dev`, passwordHash, status: UserStatus.ACTIVE },
    });
    memberUserId = memberUser.id;

    const viewerUser = await prisma.user.create({
      data: { email: `pt-viewer-${Date.now()}@test.dev`, passwordHash, status: UserStatus.ACTIVE },
    });
    viewerUserId = viewerUser.id;

    const workspace = await prisma.workspace.create({
      data: {
        name: 'PT Workspace',
        slug: `pt-ws-${Date.now()}`,
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

  it('should create a project with client from same workspace', async () => {
    const clientRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/clients`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Project Client' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'Test Project',
        clientId: clientRes.body.id,
        status: ProjectStatus.ACTIVE,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.clientId).toBe(clientRes.body.id);
    expect(res.body.workspaceId).toBe(workspaceId);
  });

  it('should reject project with client from another workspace', async () => {
    const otherWorkspace = await prisma.workspace.create({
      data: { name: 'Other PT WS', slug: `pt-other-${Date.now()}`, type: 'COMPANY', status: 'ACTIVE', ownerId: ownerUserId },
    });
    const otherClient = await prisma.client.create({
      data: { workspaceId: otherWorkspace.id, name: 'Other Client', createdBy: ownerUserId },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Bad Project', clientId: otherClient.id })
      .expect(400);

    await prisma.client.delete({ where: { id: otherClient.id } });
    await prisma.workspace.delete({ where: { id: otherWorkspace.id } });
  });

  it('should enforce project status transitions', async () => {
    const projectRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Transition Project', status: ProjectStatus.PLANNING })
      .expect(201);

    const projectId = projectRes.body.id;

    // PLANNING -> ACTIVE is valid
    await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceId}/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: ProjectStatus.ACTIVE })
      .expect(200);

    // ACTIVE -> PLANNING is invalid
    await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceId}/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: ProjectStatus.PLANNING })
      .expect(400);
  });

  it('should create a task with assignee from same workspace', async () => {
    const projectRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Task Project' })
      .expect(201);

    const taskRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/tasks`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: projectRes.body.id,
        title: 'Test Task',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        assigneeId: memberUserId,
      })
      .expect(201);

    expect(taskRes.body.id).toBeDefined();
    expect(taskRes.body.assigneeId).toBe(memberUserId);
    expect(taskRes.body.projectId).toBe(projectRes.body.id);
  });

  it('should reject task with assignee not in workspace', async () => {
    const otherUser = await prisma.user.create({
      data: { email: `pt-outsider-${Date.now()}@test.dev`, passwordHash: await bcrypt.hash('Password123!', 12), status: UserStatus.ACTIVE },
    });

    const projectRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Outsider Project' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/tasks`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: projectRes.body.id,
        title: 'Bad Task',
        assigneeId: otherUser.id,
      })
      .expect(400);

    await prisma.user.delete({ where: { id: otherUser.id } });
  });

  it('should enforce task status transitions', async () => {
    const projectRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Task Transition Project' })
      .expect(201);

    const taskRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/tasks`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: projectRes.body.id,
        title: 'Transition Task',
        status: TaskStatus.TODO,
      })
      .expect(201);

    const taskId = taskRes.body.id;

    // TODO -> IN_PROGRESS is valid
    await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: TaskStatus.IN_PROGRESS })
      .expect(200);

    // IN_PROGRESS -> DONE is invalid (must go through REVIEW)
    await request(app.getHttpServer())
      .patch(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: TaskStatus.DONE })
      .expect(400);
  });

  it('should reject VIEWER creating a project', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ name: 'Viewer Project' })
      .expect(403);
  });

  it('should reject cross-workspace project access via guessed ID', async () => {
    const otherWorkspace = await prisma.workspace.create({
      data: { name: 'Other PT WS2', slug: `pt-other2-${Date.now()}`, type: 'COMPANY', status: 'ACTIVE', ownerId: ownerUserId },
    });
    const otherProject = await prisma.project.create({
      data: { workspaceId: otherWorkspace.id, name: 'Other Project', createdBy: ownerUserId },
    });

    await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/projects/${otherProject.id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(404);

    await prisma.project.delete({ where: { id: otherProject.id } });
    await prisma.workspace.delete({ where: { id: otherWorkspace.id } });
  });

  it('should list tasks with cursor pagination', async () => {
    const projectRes = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Pagination Project' })
      .expect(201);

    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspaceId}/tasks`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ projectId: projectRes.body.id, title: `Task ${i}` })
        .expect(201);
    }

    const res = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${workspaceId}/tasks?limit=2`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(res.body.data.length).toBe(2);
    expect(res.body.hasMore).toBe(true);
    expect(res.body.nextCursor).toBeDefined();
  });
});

async function getAuthToken(app: INestApplication, email: string, password: string): Promise<string> {
  const loginRes = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);
  return loginRes.body.tokens.accessToken;
}
