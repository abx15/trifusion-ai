# TriFusion AI — Analytics Metrics

> Status: active specification for Phase 5 analytics
> Metric version: v1
> Scope: workspace-scoped metrics unless a platform role explicitly requests aggregate platform-level metrics.

## 1. Common conventions

- All workspace metrics are scoped to the authenticated workspace and must be filtered by `workspaceId` in the database layer.
- Platform aggregates are only available to `ANALYST`, `PLATFORM_ADMIN`, or `SUPERADMIN` and never expose customer-specific tenant details.
- Dates use ISO-8601 timestamps normalized to UTC before comparison.
- `dueDate` is treated in the requester’s timezone if present; otherwise UTC is used as the default server timezone.
- Empty ranges return zero counts and empty series rather than fabricated values.
- Cancelled or archived tasks and archived projects are excluded from active metrics unless the request explicitly includes them.
- `TaskStatus.DONE` is treated as complete; other states are considered open for workload and deadline calculations.

## 2. Metric definitions

### Active projects
- Business meaning: count of active project work in the selected workspace and date window.
- Formula: `COUNT(projects WHERE workspaceId = :workspaceId AND deletedAt IS NULL AND status IN ('PLANNING','ACTIVE'))`
- Data source: `Project`
- Time window: default 30 days; custom ranges are allowed up to 365 days.
- Inclusion rules: project status must not be `ARCHIVED`, and deleted records are excluded.
- Workspace scope: customer workspace only.
- Visibility: `VIEWER`, `MEMBER`, `TEAM_ADMIN`, `OWNER` within the workspace; platform staff cannot see raw workspace metrics without a workspace-scoped request.

### Overdue tasks
- Business meaning: open tasks whose due date has passed.
- Formula: `COUNT(tasks WHERE workspaceId = :workspaceId AND deletedAt IS NULL AND dueDate < NOW() AND status != 'DONE')`
- Data source: `Task`
- Time window: current time snapshot with optional filtering by creation or project filters.
- Inclusion rules: archived/deleted tasks are excluded; tasks with no due date are ignored for overdue calculations.
- Workspace scope: customer workspace only.
- Visibility: any workspace role with analytics access.

### Tasks completed per week and completion rate
- Business meaning: number of tasks completed in the reporting window and the completion share of all tasks touched in that window.
- Formula: `completedTasks = COUNT(tasks WHERE workspaceId = :workspaceId AND deletedAt IS NULL AND status = 'DONE' AND createdAt BETWEEN start AND end)` and `completionRate = completedTasks / totalTasks * 100`.
- Data source: `Task`
- Time window: default 30 days; can be customized; values are bucketed by ISO week.
- Inclusion rules: tasks created or updated in the window are considered; tasks without completion state remain in the denominator; archived/deleted tasks are excluded.
- Workspace scope: customer workspace only.
- Visibility: `VIEWER`, `MEMBER`, `TEAM_ADMIN`, `OWNER`.

### Task distribution by status and priority
- Business meaning: the count of tasks grouped by lifecycle status and priority.
- Formula: group `Task` by `status` and `priority` with `COUNT(*)` filtered to the current workspace and non-deleted rows.
- Data source: `Task`
- Time window: default 30 days unless a custom range is supplied.
- Inclusion rules: `deletedAt IS NULL` always required; archived tasks are treated as deleted unless a specific API parameter requests otherwise.
- Workspace scope: customer workspace only.
- Visibility: any workspace role with analytics access.

### Team workload
- Business meaning: number of open tasks per active member and weighted load by priority.
- Formula: `openTasksPerAssignee = COUNT(tasks WHERE assigneeId IS NOT NULL AND status != 'DONE' AND workspaceId = :workspaceId AND deletedAt IS NULL)`; weighted load uses `URGENT=4, HIGH=3, MEDIUM=2, LOW=1`.
- Data source: `Task` and `WorkspaceMember`
- Time window: default 30 days; custom ranges allowed.
- Inclusion rules: unassigned tasks are excluded from per-member workload; suspended or inactive members are not counted as active.
- Workspace scope: customer workspace only.
- Visibility: `TEAM_ADMIN`, `OWNER`, and `MEMBER` where explicit access is granted; `VIEWER` may only see the aggregated result, not member-level private details if policy denies it.

### Client activity
- Business meaning: number of clients that were active in the period through projects or task activity.
- Formula: `DISTINCT clientId` from projects and tasks associated with the workspace and date range.
- Data source: `Project`, `Task`, `Client`
- Time window: default 30 days; custom ranges allowed.
- Inclusion rules: archived or deleted client records are excluded. A client is active if a linked project or task was touched in the window.
- Workspace scope: customer workspace only.
- Visibility: `VIEWER`, `MEMBER`, `TEAM_ADMIN`, `OWNER` with workspace access.

### Upcoming deadlines
- Business meaning: count of tasks due in the next 7 days that remain open.
- Formula: `COUNT(tasks WHERE workspaceId = :workspaceId AND deletedAt IS NULL AND dueDate >= NOW() AND dueDate < NOW() + 7 days AND status != 'DONE')`
- Data source: `Task`
- Time window: rolling 7-day window.
- Inclusion rules: tasks without due dates are ignored.
- Workspace scope: customer workspace only.
- Visibility: any workspace role with analytics access.

### Trend metrics (week over week / month over month)
- Business meaning: change in task creation and completion over time.
- Formula: time series built by grouping tasks by day or ISO week and comparing current bucket to prior bucket. Empty periods are reported as zero values rather than omitted.
- Data source: `Task`
- Time window: default 30-day window, with up to 365 days allowed.
- Inclusion rules: `deletedAt IS NULL`; day/week buckets with no events are intentionally represented as zero to keep series aligned.
- Workspace scope: customer workspace only.
- Visibility: any workspace role with analytics access.

### Platform-level aggregates
- Business meaning: operational metrics for product health and usage at the platform level.
- Formula: aggregate counts of active workspaces, user signups, and workspace-level usage by status; only counts are exposed and only through approved analytic endpoints.
- Data source: `Workspace`, `User`, `WorkspaceMember`, `Task`, `Project`
- Time window: default rolling 30 days for platform summaries; custom date windows permitted only when explicitly authorized.
- Inclusion rules: no customer-specific project names, task titles, or per-workspace details are exposed to `ANALYST` and above unless explicitly documented.
- Workspace scope: platform only; raw customer content is not included.
- Visibility: `ANALYST`, `PLATFORM_ADMIN`, `SUPERADMIN`.

## 3. Authorization and security rules

- Workspace-scoped analytics enforce the same `PolicyService` checks as project and task reads.
- Platform-level analytics are protected by `PlatformRolesGuard` and require the minimum role indicated by the endpoint.
- All date parameters are validated server-side and must be ISO strings; reversed ranges are rejected.
- The service must never leak cross-workspace data due to a missing `workspaceId` or filter mismatch.
- Caching is allowed only for safe, tenant-scoped analytics results and must include workspace ID and filter signatures in the key.

## 4. Standard response envelope

```json
{
  "workspaceId": "uuid",
  "reportingPeriod": {
    "start": "2026-10-01T00:00:00.000Z",
    "end": "2026-10-31T23:59:59.999Z"
  },
  "filters": {
    "projectId": null,
    "status": null,
    "assigneeId": null
  },
  "generatedAt": "2026-10-18T15:11:05.569Z",
  "dataFreshness": "live",
  "metricVersion": "v1",
  "metrics": {
    "activeProjects": 14,
    "overdueTasks": 3
  }
}
```

## 5. Implementation notes

- NestJS owns analytics orchestration. The frontend only reads the data and renders it.
- REST and GraphQL routes call the same service to preserve a single source of truth.
- Use Prisma aggregation for counts when it is clear and efficient; if a dashboard query becomes too expensive, add a measured optimization only after EXPLAIN ANALYZE confirms the need.
- Never fabricate metrics when the underlying workspace has no data. Return zero counts and empty series instead.
