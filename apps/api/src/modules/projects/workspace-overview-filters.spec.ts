import { BadRequestException } from '@nestjs/common';
import { ProjectStatus, TaskStatus } from '@prisma/client';
import {
  normalizeWorkspaceOverviewFilters,
  WorkspaceOverviewFilterValues,
} from './workspace-overview-filters';

describe('normalizeWorkspaceOverviewFilters', () => {
  it('normalizes bounded filters without altering their values', () => {
    const lower = '2026-10-01T00:00:00.000Z';
    const upper = '2026-10-18T00:00:00.000Z';
    expect(
      normalizeWorkspaceOverviewFilters({
        projectId: '123e4567-e89b-42d3-a456-426614174000',
        assigneeId: '123e4567-e89b-42d3-a456-426614174001',
        projectStatus: ProjectStatus.ACTIVE,
        taskStatus: TaskStatus.IN_PROGRESS,
        createdAfter: lower,
        createdBefore: upper,
      }),
    ).toEqual({
      projectId: '123e4567-e89b-42d3-a456-426614174000',
      assigneeId: '123e4567-e89b-42d3-a456-426614174001',
      projectStatus: ProjectStatus.ACTIVE,
      taskStatus: TaskStatus.IN_PROGRESS,
      createdAt: { gte: new Date(lower), lte: new Date(upper) },
    });
  });

  const invalidFilters: Array<[WorkspaceOverviewFilterValues, string]> = [
    [{ projectId: 'not-a-uuid' }, 'projectId'],
    [{ assigneeId: 'not-a-uuid' }, 'assigneeId'],
    [{ createdAfter: 'not-a-date' }, 'createdAfter'],
    [{ createdBefore: 'not-a-date' }, 'createdBefore'],
    [
      { createdAfter: '2026-10-18T00:00:00Z', createdBefore: '2026-10-01T00:00:00Z' },
      'createdAfter',
    ],
  ];

  it.each(invalidFilters)('rejects invalid filter %s', (filters) => {
    expect(() => normalizeWorkspaceOverviewFilters(filters)).toThrow(BadRequestException);
  });
});
