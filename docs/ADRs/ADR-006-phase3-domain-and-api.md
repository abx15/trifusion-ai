# ADR-006: Phase 3 Domain APIs, GraphQL Reads, Pagination, and Retention

## Status
Accepted

## Date
2026-10-18

## Context
Phase 3 adds workspace-owned clients, projects, tasks, activity, settings, and dashboard reads. REST and GraphQL must remain interfaces to the same NestJS policies and domain services, with bounded query cost and recoverable records.

## Decisions

1. NestJS domain services own business rules and workspace checks. REST controllers and GraphQL resolvers are thin adapters; GraphQL is read-only in this phase.
2. GraphQL uses NestJS code-first schema generation. Only `workspaceOverview`, paginated `projects`, paginated `tasks`, and paginated `recentActivity` are exposed. Project/client and task/project/assignee relations are loaded with Prisma relation includes in the domain query, avoiding per-row resolver queries.
3. GraphQL list operations require a `limit` from 1 through 50 and use opaque cursors. The server rejects oversized limits. Queries are limited to depth 5, complexity 100, per-resolver execution timeout 5 seconds, and the global request rate limit. Introspection, playground, and debug output are disabled in production.
4. REST lists use an opaque ID cursor, deterministic requested ordering plus ID tie-break, and skip the cursor row. Sort keys are allow-listed per resource. Page sizes are 1 through 50.
5. Clients, projects, and tasks use soft deletion (`deletedAt`) and restore operations. Parent archival is blocked until active children have been archived. No hard-delete endpoint is added in Phase 3; activity/audit history is retained.
6. Task creation starts in `TODO`; task transitions are `TODO -> IN_PROGRESS -> REVIEW -> DONE` with backward transitions to `TODO` or `IN_PROGRESS` to reopen work. Projects start in `PLANNING` or `ACTIVE`; normal lifecycle transitions are `PLANNING -> ACTIVE`, `ACTIVE -> ON_HOLD | COMPLETED`, and `ON_HOLD -> ACTIVE`. Archive/restore is an administrative operation.
7. Each domain mutation records its ActivityEvent and typed AuditLog entry in the same transaction. Correlation IDs are stored in event metadata and `AuditLog.requestId`; audit metadata excludes business content.
8. Neon runtime queries use pooled `DATABASE_URL`; migrations use direct `DIRECT_URL`. A separate `DATABASE_URL_TEST` / `DIRECT_URL_TEST` pair is required for integration tests and test migrations.

## Consequences

- REST and GraphQL cannot drift into separate authorization/business implementations.
- Stable ordering and bounded limits make cursor pagination predictable and query cost finite.
- Soft deletion preserves auditability but requires child archival before parent archival.
- GraphQL needs schema/limit tests in addition to service authorization tests.
- Integration verification is blocked unless an isolated non-production test branch is configured.
