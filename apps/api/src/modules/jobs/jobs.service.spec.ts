import { JobsService } from './jobs.service';

describe('JobsService tenant isolation', () => {
  const jobRecord = {
    create: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
  };
  let service: JobsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new JobsService({ jobRecord } as any);
  });

  it('creates a job inside the required workspace', async () => {
    const created = { id: 'job-1', workspaceId: 'workspace-a' };
    jobRecord.create.mockResolvedValue(created);

    await expect(service.create('workspace-a', 'manual')).resolves.toEqual(created);
    expect(jobRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ workspaceId: 'workspace-a', type: 'manual', status: 'queued' }),
    });
  });

  it('lists jobs only for the requested workspace', async () => {
    jobRecord.findMany.mockResolvedValue([]);

    await service.list('workspace-a');

    expect(jobRecord.findMany).toHaveBeenCalledWith({
      where: { workspaceId: 'workspace-a' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });
});
