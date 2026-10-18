# TriFusion AI — API Contracts

> **Document Status:** Active Specification  
> **API Version:** v1 (`/api/v1`)  
> **Interactive Docs:** Swagger UI available at `/api/docs`

---

## 1. API Conventions

- **Base URL Prefix**: `/api/v1`
- **Payload Format**: `application/json`
- **Authentication**: Bearer Token in `Authorization` header (`Bearer <access_token>`)
- **Tenant Context**: `X-Workspace-Id: <uuid>` header for workspace-scoped actions (verified server-side against authenticated user's memberships)
- **Browser session**: The Next.js apps call their same-origin `/api/backend/*` proxy. It stores short-lived access and rotating refresh tokens in app-specific HttpOnly, SameSite=Strict cookies, adds the bearer token server-side, and never returns auth tokens to browser JavaScript. `API_INTERNAL_URL` is server-only; direct REST/GraphQL clients continue to use bearer tokens.
- **Standard Error Response**:
  ```json
  {
    "statusCode": 400,
    "timestamp": "2026-10-15T12:00:00.000Z",
    "path": "/api/v1/auth/login",
    "message": "Invalid email or password",
    "errors": []
  }
  ```

---

## 2. Authentication & Identity Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/register`
- **Summary**: Register a new user account with personal workspace creation.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "user": {
      "id": "c8a4d45e-...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "d820f18a-..."
    }
  }
  ```

### `POST /api/v1/auth/login`
- **Summary**: Authenticate with email and password.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "user": {
      "id": "c8a4d45e-...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "d820f18a-..."
    }
  }
  ```

### `POST /api/v1/auth/refresh`
- **Summary**: Refresh an expired access token using a valid refresh token.
- **Request Body**:
  ```json
  {
    "refreshToken": "d820f18a-..."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "e931g29b-..."
  }
  ```

### `POST /api/v1/auth/logout`
- **Summary**: Invalidate the user's refresh token and terminate session.
- **Headers**: `Authorization: Bearer <access_token>`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### `GET /api/v1/auth/me`
- **Summary**: Retrieve currently authenticated user profile and workspaces.
- **Headers**: `Authorization: Bearer <access_token>`
- **Response `200 OK`**:
  ```json
  {
    "id": "c8a4d45e-...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isEmailVerified": false,
    "avatarUrl": null,
    "workspaces": [
      {
        "id": "w1b4d45e-...",
        "name": "John's Workspace",
        "slug": "johns-workspace",
        "type": "PERSONAL",
        "role": "OWNER"
      }
    ]
  }
  ```

### `POST /api/v1/auth/forgot-password`
- **Summary**: Request a password reset email token.
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "If the email is registered, a password reset link has been dispatched."
  }
  ```

### `POST /api/v1/auth/reset-password`
- **Summary**: Reset password using a valid reset token.
- **Request Body**:
  ```json
  {
    "token": "reset-token-uuid",
    "newPassword": "NewPassword123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "message": "Password reset successfully. You may now sign in."
  }
  ```

---

## 3. Health & Monitoring Endpoints (`/api/v1/health`)

### `GET /api/v1/health`
- **Summary**: Liveness and readiness health check for load balancers and orchestrators.
- **Response `200 OK`**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-15T12:00:00.000Z",
    "uptime": 124.5,
    "services": {
      "database": "up",
      "redis": "up"
    }
  }
  ```

---

## 4. Phase 3 Workspace Domain REST APIs

All resource routes require a bearer access token and use the workspace path as a selection, never as proof of access. NestJS verifies current membership and role for each request. Unknown body/query fields are rejected.

| Resource | Routes |
|---|---|
| Clients | `GET/POST /api/v1/workspaces/:workspaceId/clients`; `GET/PATCH /api/v1/workspaces/:workspaceId/clients/:clientId`; `DELETE .../:clientId/archive`; `PATCH .../:clientId/restore` |
| Projects | `GET/POST /api/v1/workspaces/:workspaceId/projects`; `GET/PATCH /api/v1/workspaces/:workspaceId/projects/:projectId`; `DELETE .../:projectId/archive`; `PATCH .../:projectId/restore` |
| Tasks | `GET/POST /api/v1/workspaces/:workspaceId/tasks`; `GET/PATCH /api/v1/workspaces/:workspaceId/tasks/:taskId`; `PATCH .../:taskId/status`; `DELETE .../:taskId/archive`; `PATCH .../:taskId/restore` |
| Activity | `GET /api/v1/workspaces/:workspaceId/activity` |
| Workspace settings | `GET/PATCH /api/v1/workspaces/:workspaceId/settings` |

`POST`, `PATCH`, archive, restore, and settings mutations are rate-limited. Creation/update DTOs accept only documented fields; updates require at least one field. A settings read returns `null` until the workspace settings are first saved. Read/write permissions follow [`AUTHORIZATION_MATRIX.md`](./AUTHORIZATION_MATRIX.md); archival and settings changes require `TEAM_ADMIN` or `OWNER`.

### Cursor pagination

List endpoints return `{ "data": [], "nextCursor": "opaque-or-null", "hasMore": false, "total": 0, "limit": 20 }`. `limit` defaults to 20 and must be 1–50. Supplying a limit above 50 is rejected. Cursors are opaque, stable across equal sort values, and must be passed unchanged. Filters and sort keys are resource-specific allow-lists documented by the Swagger schemas; date range lower bounds cannot exceed upper bounds.

### Phase 3 GraphQL (read-only)

GraphQL is served at `POST /graphql` by NestJS. It uses the same domain services and workspace policy checks as REST; no client-supplied role or ownership field is accepted.

- `workspaceOverview(workspaceId, filters)` — persisted project/task status counts, overdue tasks, and deadlines within seven days. The optional filter input allow-lists project ID, project/task statuses, active assignee ID, and ISO `createdAfter`/`createdBefore` bounds. Date bounds are inclusive and reversed ranges or malformed UUIDs are rejected. Project and task aggregates remain workspace-scoped.
- `projects(workspaceId, limit!, cursor, status, clientId)` — cursor-paginated projects with client and task-count fields; `status: ARCHIVED` lists soft-archived projects.
- `tasks(workspaceId, limit!, cursor, status, priority, projectId, projectStatus, assigneeId, includeArchived)` — cursor-paginated tasks with project/client and safe assignee details; archived records are excluded unless explicitly requested.
- `recentActivity(workspaceId, limit!, cursor)` — cursor-paginated workspace activity.

All lists require a page size of 1–50. Query depth is capped at 5, complexity at 100, resolver execution at 5 seconds, and requests are rate-limited. Related records are fetched in batched Prisma includes. Production disables introspection/playground and returns sanitized internal errors.

### Phase 5 analytics additions

Phase 5 introduces the workspace analytics service used by both REST and GraphQL to power dashboard summary widgets and trend reporting. The same filter model is reused across endpoints to keep the API consistent.

- `GET /api/v1/workspaces/:workspaceId/analytics/overview` — returns active-project counts, overdue tasks, deadlines, task distribution, and workload summary for the selected workspace.
- `GET /api/v1/workspaces/:workspaceId/analytics/tasks` — returns task-level metrics and priority breakdowns for the chosen window.
- `GET /api/v1/workspaces/:workspaceId/analytics/projects` — returns project status distribution and pipeline volume.
- `GET /api/v1/workspaces/:workspaceId/analytics/team-workload` — returns per-member open-task load, weighted by priority.
- `GET /api/v1/workspaces/:workspaceId/analytics/client-activity` — returns client activity counts that touched the workspace in the requested time period.
- `GET /api/v1/workspaces/:workspaceId/analytics/trends` — returns a time series for task creation and completion for dashboards and week-over-week comparisons.
- `GET /api/v1/platform/analytics/overview` — platform aggregate summary, restricted to `ANALYST`, `PLATFORM_ADMIN`, and `SUPERADMIN`.

All analytics responses include a standard envelope with `reportingPeriod`, `filters`, `generatedAt`, `dataFreshness`, and `metricVersion`. Date ranges are ISO-8601 and must not exceed 365 days. Invalid or reversed ranges are rejected. Empty ranges return zero counts, never estimated values.
