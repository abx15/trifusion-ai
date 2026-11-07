import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PolicyService } from '../../common/policy/policy.service';

describe('AnalyticsService role scoping', () => {
  const prisma = {
    project: {
      groupBy: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    task: {
      groupBy: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const policy = {
    getWorkspaceContext: jest.fn(),
  };
  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.task.groupBy.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.project.groupBy.mockResolvedValue([]);
    prisma.project.count.mockResolvedValue(0);
    service = new AnalyticsService(
      prisma as unknown as PrismaService,
      policy as unknown as PolicyService,
    );
  });

  it('restricts member task analytics to tasks assigned to the current user', async () => {
    policy.getWorkspaceContext.mockResolvedValue({ role: 'MEMBER' });

    await service.getTaskAnalytics('workspace-1', 'member-1');

    expect(prisma.task.groupBy).toHaveBeenCalledTimes(2);
    for (const call of prisma.task.groupBy.mock.calls) {
      expect(call[0].where).toMatchObject({
        workspaceId: 'workspace-1',
        assigneeId: 'member-1',
      });
    }
  });

  it('counts overdue and upcoming tasks outside the 30-day reporting window', async () => {
    policy.getWorkspaceContext.mockResolvedValue({
      role: 'OWNER',
      workspaceName: 'Workspace One',
    });

    await service.getWorkspaceOverview('workspace-1', 'owner-1');

    const dueDateQueries = prisma.task.count.mock.calls.map((call) => call[0].where);
    expect(dueDateQueries).toHaveLength(2);
    for (const where of dueDateQueries) {
      expect(where.createdAt).toBeUndefined();
      expect(where.workspaceId).toBe('workspace-1');
      expect(where.deletedAt).toBeNull();
      expect(where.status).toEqual({ not: 'DONE' });
    }
  });

  it('scopes member project analytics to projects with their assigned tasks', async () => {
    policy.getWorkspaceContext.mockResolvedValue({ role: 'MEMBER' });

    await service.getProjectAnalytics('workspace-1', 'member-1');

    expect(prisma.project.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: 'workspace-1',
          tasks: { some: { assigneeId: 'member-1', deletedAt: null } },
        }),
      }),
    );
  });

  it('preserves workload status filters while excluding completed tasks', async () => {
    policy.getWorkspaceContext.mockResolvedValue({ role: 'OWNER' });

    await service.getTeamWorkload('workspace-1', 'owner-1', {
      taskStatus: 'TODO' as any,
      projectStatus: 'ACTIVE' as any,
    });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          workspaceId: 'workspace-1',
          project: { is: { status: 'ACTIVE' } },
          AND: [
            { status: { not: 'DONE' } },
            { status: 'TODO' },
          ],
        }),
      }),
    );
  });

  it('does not force an assignee filter on owner workspace analytics', async () => {
    policy.getWorkspaceContext.mockResolvedValue({ role: 'OWNER' });

    await service.getTaskAnalytics('workspace-1', 'owner-1');

    for (const call of prisma.task.groupBy.mock.calls) {
      expect(call[0].where.workspaceId).toBe('workspace-1');
      expect(call[0].where.assigneeId).toBeUndefined();
    }
  });
});
