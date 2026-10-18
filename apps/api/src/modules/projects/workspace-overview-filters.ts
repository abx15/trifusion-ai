import { BadRequestException } from '@nestjs/common';
import { ProjectStatus, TaskStatus } from '@prisma/client';

export interface WorkspaceOverviewFilterValues {
  projectId?: string;
  projectStatus?: ProjectStatus;
  taskStatus?: TaskStatus;
  assigneeId?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export interface NormalizedWorkspaceOverviewFilters {
  projectId?: string;
  projectStatus?: ProjectStatus;
  taskStatus?: TaskStatus;
  assigneeId?: string;
  createdAt?: { gte?: Date; lte?: Date };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeWorkspaceOverviewFilters(
  filters: WorkspaceOverviewFilterValues = {},
): NormalizedWorkspaceOverviewFilters {
  if (filters.projectId && !UUID_PATTERN.test(filters.projectId)) {
    throw new BadRequestException('projectId must be a valid UUID');
  }
  if (filters.assigneeId && !UUID_PATTERN.test(filters.assigneeId)) {
    throw new BadRequestException('assigneeId must be a valid UUID');
  }

  const lowerBound = filters.createdAfter ? new Date(filters.createdAfter) : undefined;
  const upperBound = filters.createdBefore ? new Date(filters.createdBefore) : undefined;
  if (lowerBound && Number.isNaN(lowerBound.getTime())) {
    throw new BadRequestException('createdAfter must be a valid date');
  }
  if (upperBound && Number.isNaN(upperBound.getTime())) {
    throw new BadRequestException('createdBefore must be a valid date');
  }
  if (lowerBound && upperBound && lowerBound > upperBound) {
    throw new BadRequestException('createdAfter must not be later than createdBefore');
  }

  return {
    ...(filters.projectId ? { projectId: filters.projectId } : {}),
    ...(filters.projectStatus ? { projectStatus: filters.projectStatus } : {}),
    ...(filters.taskStatus ? { taskStatus: filters.taskStatus } : {}),
    ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}),
    ...(lowerBound || upperBound
      ? { createdAt: { ...(lowerBound ? { gte: lowerBound } : {}), ...(upperBound ? { lte: upperBound } : {}) } }
      : {}),
  };
}
