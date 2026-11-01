# Authentication and Authorization Audit

**Date:** 2026-11-01  
**Status:** PARTIAL — verified paths are listed below; unexecuted cases are not claimed as passing.

## Verified

| Area | Result | Evidence |
|---|---|---|
| Customer login | PASS | Seeded OWNER, TEAM_ADMIN, MEMBER, and VIEWER credentials returned HTTP 200 from NestJS. |
| Platform login | PASS | Seeded SUPERADMIN, PLATFORM_ADMIN, ANALYST, and SUPPORT_AGENT credentials returned HTTP 200. |
| Workspace role resolution | PASS | Company workspace is preferred over a personal OWNER space; each seeded customer role resolved correctly after login. |
| Platform/customer separation | PASS | Platform login validates `/platform/staff/me`; customer credentials are not accepted as platform staff. |
| Workspace switching validation | PASS | `WorkspaceGuard` and `WorkspacesService.validateSwitch` resolve role from the selected workspace. |
| Backend role guards | PASS | Controllers use `JwtAuthGuard`, `WorkspaceGuard`, `PlatformRolesGuard`, and policy decorators. |
| Invalid refresh token and refresh-token reuse | PASS (unit) | `apps/api/src/modules/auth/auth.service.spec.ts` verifies rotation revokes the old token and rejects reuse. |
| Suspended/expired access-token request cases | NOT TESTED | Requires isolated request-level fixtures and token-expiry control. |
| Logout revocation | PASS (unit) | `AuthService.logout` revokes all active refresh tokens; covered by the auth service suite. |
| Cross-tenant negative mutation matrix | NOT TESTED | Existing integration tests should be expanded before claiming full coverage. |

## Fixes made during this audit

- Added the missing `dev` script to `apps/api/package.json`, allowing the API to participate in the root Turbo development command.
- Changed the web workspace bootstrap to prefer a COMPANY workspace, preventing a personal OWNER membership from masking the user's actual company role.
