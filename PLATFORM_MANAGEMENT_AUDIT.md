# Platform Management Audit

## Scope and evidence

This audit is based on the repository as it exists on 2026-11-06. It describes
implemented code, not the requested target state. No production data or
migrations were modified during the audit.

## Architecture inventory

| Area        | Actual implementation                                                                                                                                          | Status                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Repository  | pnpm/Turborepo monorepo with `apps/api`, `apps/web`, `apps/platform-admin`, shared packages, Prisma, and Django AI service                                     | COMPLETE              |
| API         | NestJS modular monolith with REST, GraphQL, WebSocket/realtime, Swagger, Prisma, and global filters/interceptors                                               | COMPLETE              |
| Customer UI | Next.js 16 App Router workspace dashboard                                                                                                                      | COMPLETE              |
| Platform UI | Separate Next.js 16 App Router application with role-specific pages for superadmin, admin, analyst, and support                                                | PARTIALLY IMPLEMENTED |
| Database    | PostgreSQL/Neon through Prisma; schema contains user, workspace, membership, staff, audit, notification, jobs, entitlement, grant, support, and product models | COMPLETE              |
| AI service  | Django service exists under `services/ai-django`; API integration exists, but live availability depends on environment configuration                           | PARTIALLY IMPLEMENTED |
| Redis/jobs  | ioredis and job records/modules exist; platform health previously reported Redis/queue as healthy without checking connectivity                                | BROKEN                |

## Roles and authorization

The database and contracts define exactly four platform roles:
`SUPERADMIN`, `PLATFORM_ADMIN`, `ANALYST`, and `SUPPORT_AGENT`. Customer
workspace roles remain separate: `OWNER`, `TEAM_ADMIN`, `MEMBER`, and `VIEWER`.
`PolicyService`, `PlatformRolesGuard`, `WorkspaceGuard`, and authorization
decorators enforce server-side checks.

| Capability                     | Finding                                                                                                              | Status                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Role separation                | Platform and workspace role namespaces are separate                                                                  | COMPLETE              |
| Workspace tenancy              | Workspace membership and active workspace are checked server-side                                                    | COMPLETE              |
| Last workspace owner           | Policy methods protect the last owner                                                                                | COMPLETE              |
| Last platform SUPERADMIN role  | Role revocation is protected                                                                                         | COMPLETE              |
| Last active SUPERADMIN account | Account status endpoint could suspend the last active SUPERADMIN                                                     | BROKEN                |
| Granular permissions           | Hierarchy guards exist, but some platform routes use broad role thresholds rather than resource-specific permissions | PARTIALLY IMPLEMENTED |
| Support data isolation         | Customer support sessions are consent/time bounded; platform ticket listing is global for permitted staff            | PARTIALLY IMPLEMENTED |
| Secrets                        | Secrets are not returned by the platform UI/API paths reviewed                                                       | NEEDS SECURITY REVIEW |

## API and module inventory

Implemented API modules include authentication, workspaces, clients,
projects, tasks, activity, analytics, notifications, files, realtime, jobs,
AI, billing, email, support, health, audit, and platform administration.

Platform routes are under `/platform/v1` and include staff context, health,
metrics, users, workspaces, staff roles, feature flags, plans, privileged
grants, audit logs, and support routes. Authentication exposes registration,
login, refresh, password recovery/reset, logout, current-user lookup, and
invitation acceptance.

The API uses DTO validation in several sensitive endpoints, but list filters
in platform and support controllers are still typed as generic query objects
and should be converted to validated DTOs before broadening the API.

## Data and lifecycle findings

Implemented:

- User status (`ACTIVE`, `SUSPENDED`, `DELETED`) and email verification tokens.
- Refresh-token and password-reset-token persistence.
- Workspace membership and invitation lifecycle.
- Platform staff role lifecycle with audit events.
- Hash-chained audit records and integrity verification.
- Notifications, preferences, support tickets, support sessions, and jobs.
- Feature flags, plans, entitlements, and privileged access grants.

Missing or incomplete:

- No verified platform-wide subscription/MRR/ARR model is exposed by the
  platform metrics endpoint; financial metrics must not be inferred.
- No complete platform staff invitation/onboarding workflow was found.
- No business strategy/objective/forecast data model was found.
- No platform-wide customer lifecycle/activity timeline endpoint was found.
- Support ticket conversation messages, attachments, SLA automation, and
  customer-facing notifications are not represented as complete first-class
  API workflows.

## UI findings

The platform app has distinct top-level pages and role-specific navigation,
but several navigation entries point to shared or not-yet-created pages.
Some dashboard cards use presentation-only trend strings and fallback chart
series. These must be replaced with explicitly labelled live, unavailable, or
estimated states.

Loading and error states exist on the main dashboard pages. Empty states exist
in several tables. Responsive behavior is present but should be validated with
browser tests for each role.

## Monitoring findings

Database health performs a real `SELECT 1`. Redis, queue, AI, and storage
checks previously returned success-shaped placeholders. The implementation
now reports unconfigured Redis, AI, and storage as degraded and performs a
real Redis ping and AI `/health` request when configured. Queue depth and
storage object checks remain future work.

## Tests and deployment

The repository contains unit/security tests under API modules and Playwright
authentication/RBAC E2E tests. Tests were not claimed as passing by this
audit; they require configured environment variables and a reachable
database. The repository has production environment files, but credentials
must remain local and should be rotated if exposed.

## Recommended implementation order

1. Convert platform query inputs to validated DTOs and add resource-specific
   permissions.
2. Complete user/workspace directory actions with pagination, audit events,
   and safe bulk-operation limits.
3. Implement platform staff invitation/onboarding and approval workflows.
4. Add normalized support conversations, attachments, SLA jobs, and scoped
   platform ticket access.
5. Add business strategy and analytics models only where source data exists;
   label forecasts and estimates.
6. Replace UI fallback metrics with live endpoint data and explicit
   unavailable states.
7. Add configured queue/storage health probes and realistic performance tests.
