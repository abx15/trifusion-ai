import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PolicyService } from '../../common/policy/policy.service';

describe('AnalyticsService role scoping', () => {
  const prisma = {
    task: {
      groupBy: jest.fn().mockResolvedValue([]),
    },
  };
  const policy = {
    getWorkspaceContext: jest.fn(),
  };
  let service: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.task.groupBy.mockResolvedValue([]);
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

  it('does not force an assignee filter on owner workspace analytics', async () => {
    policy.getWorkspaceContext.mockResolvedValue({ role: 'OWNER' });

    await service.getTaskAnalytics('workspace-1', 'owner-1');

    for (const call of prisma.task.groupBy.mock.calls) {
      expect(call[0].where.workspaceId).toBe('workspace-1');
      expect(call[0].where.assigneeId).toBeUndefined();
    }
  });
});
