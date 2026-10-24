# TriFusion AI — Database Design

> **Document Status:** Active Specification  
> **Target Database:** PostgreSQL 15+  
> **ORM:** Prisma  
> **Schema Path:** `database/prisma/schema.prisma`

---

## 1. Schema Overview

The database design provides high-performance relational integrity, strict multi-tenancy logical isolation, and full auditability for TriFusion AI.

### Core Domain Clusters

1. **Identity & Authentication**: Users, profiles, credentials, refresh tokens, password reset tokens, and email verification tokens.
2. **Workspaces & Tenancy**: Workspaces (personal & company), membership records, invitations, and role assignments.
3. **Core Business Entities**: Clients, projects, project members, tasks, task comments, and attachments.
4. **Collaboration & Activity**: Activity events, in-app notifications, and audit logs.
5. **AI & Quotas**: AI usage tracking records, token consumption logs, and quota limits.

---

## 2. Entity Relationship Model

```text
  +------------------+
  |       User       |
  +--------+---------+
           | 1
           | 
           | 1
  +--------v---------+        +----------------------+
  |   UserProfile    |        |     RefreshToken     |
  +------------------+        +----------+-----------+
           |                             |
           +-----------------------------+
           | 1
           |
           | *
  +--------v---------+ 1           * +----------------------+
  | WorkspaceMember  |<--------------+      Workspace       |
  +------------------+               +----------+-----------+
                                                | 1
                      +-------------------------+-------------------------+
                      | *                                                 | *
             +--------v---------+                                +--------v---------+
             |      Client      |                                |     Project      |
             +--------+---------+                                +--------+---------+
                      | 1                                                 | 1
                      |                                                   |
                      +-------------------+                               |
                                          | *                             | *
                                 +--------v---------+            +--------v---------+
                                 |     Project      |            |       Task       |
                                 +------------------+            +--------+---------+
                                                                          | 1
                                                                          | *
                                                                 +--------v---------+
                                                                 |   TaskComment    |
                                                                 +------------------+
```

---

## 3. Data Tables Specification

### Identity & Authentication

- **`User`**:
  - `id`: UUID (Primary Key, default `uuid()`)
  - `email`: String (Unique, case-insensitive index)
  - `passwordHash`: String (Bcrypt salted hash, nullable for OAuth accounts)
  - `isEmailVerified`: Boolean (default `false`)
  - `isActive`: Boolean (default `true`)
  - `createdAt`: Timestamp with timezone
  - `updatedAt`: Timestamp with timezone

- **`UserProfile`**:
  - `id`: UUID (Primary Key)
  - `userId`: UUID (Unique Foreign Key -> `User.id`, ON DELETE CASCADE)
  - `firstName`: String
  - `lastName`: String
  - `avatarUrl`: String (Nullable)
  - `timezone`: String (default `"UTC"`)
  - `locale`: String (default `"en"`)

- **`RefreshToken`**:
  - `id`: UUID (Primary Key)
  - `userId`: UUID (Foreign Key -> `User.id`, ON DELETE CASCADE)
  - `tokenHash`: String (Hashed token for revocation check)
  - `deviceInfo`: String (Nullable)
  - `expiresAt`: Timestamp with timezone
  - `createdAt`: Timestamp with timezone

- **`PasswordResetToken`**:
  - `id`: UUID (Primary Key)
  - `userId`: UUID (Foreign Key -> `User.id`, ON DELETE CASCADE)
  - `tokenHash`: String (Indexed)
  - `expiresAt`: Timestamp with timezone
  - `usedAt`: Timestamp with timezone (Nullable)
  - `createdAt`: Timestamp with timezone

- **`EmailVerificationToken`**:
  - `id`: UUID (Primary Key)
  - `userId`: UUID (Foreign Key -> `User.id`, ON DELETE CASCADE)
  - `tokenHash`: String (Indexed)
  - `expiresAt`: Timestamp with timezone
  - `usedAt`: Timestamp with timezone (Nullable)
  - `createdAt`: Timestamp with timezone

### Workspaces & Tenancy

- **`Workspace`**:
  - `id`: UUID (Primary Key, default `uuid()`)
  - `name`: String
  - `slug`: String (Unique index)
  - `type`: Enum `PERSONAL` | `COMPANY`
  - `status`: Enum `ACTIVE` | `SUSPENDED` | `ARCHIVED` (default `ACTIVE`)
  - `ownerId`: UUID (Foreign Key -> `User.id`, ON DELETE RESTRICT)
  - `createdAt`: Timestamp with timezone
  - `updatedAt`: Timestamp with timezone

- **`WorkspaceMember`**:
  - `id`: UUID (Primary Key)
  - `workspaceId`: UUID (Foreign Key -> `Workspace.id`, ON DELETE CASCADE)
  - `userId`: UUID (Foreign Key -> `User.id`, ON DELETE CASCADE)
  - `role`: Enum `OWNER` | `TEAM_ADMIN` | `MEMBER` | `VIEWER` (default `MEMBER`)
  - `status`: Enum `ACTIVE` | `SUSPENDED` (default `ACTIVE`)
  - `joinedAt`: Timestamp with timezone (default `now()`)
  - `createdAt`: Timestamp with timezone
  - Unique Constraint: `(workspaceId, userId)`
  - Indexes: `[workspaceId]`, `[userId]`, `[workspaceId, role]`, `[status]`

- **`WorkspaceInvitation`**:
  - `id`: UUID (Primary Key)
  - `workspaceId`: UUID (Foreign Key -> `Workspace.id`, ON DELETE CASCADE)
  - `email`: String (Indexed)
  - `role`: Enum `OWNER` | `TEAM_ADMIN` | `MEMBER` | `VIEWER` (default `MEMBER`)
  - `tokenHash`: String (Unique)
  - `inviterId`: UUID (Foreign Key -> `User.id`, ON DELETE RESTRICT)
  - `status`: Enum `PENDING` | `ACCEPTED` | `REVOKED` | `EXPIRED` (default `PENDING`)
  - `expiresAt`: Timestamp with timezone (Indexed)
  - `acceptedAt`: Timestamp with timezone (Nullable)
  - `revokedAt`: Timestamp with timezone (Nullable)
  - `createdAt`: Timestamp with timezone
  - Unique Constraint: `(workspaceId, email)`

### Platform Staff & Auditing

- **`PlatformStaffRole`**:
  - `id`: UUID (Primary Key)
  - `userId`: UUID (Foreign Key -> `User.id`, ON DELETE CASCADE)
  - `role`: Enum `SUPERADMIN` | `PLATFORM_ADMIN` | `ANALYST` | `SUPPORT_AGENT`
  - `status`: Enum `ACTIVE` | `INACTIVE` | `SUSPENDED` (default `ACTIVE`)
  - `grantedBy`: String (Nullable)
  - `grantedAt`: Timestamp with timezone (default `now()`)
  - `revokedAt`: Timestamp with timezone (Nullable)
  - `reason`: String (Nullable)
  - `createdAt`: Timestamp with timezone
  - `updatedAt`: Timestamp with timezone
  - Unique Constraint: `(userId, role)`

- **`AuditLog`**:
  - `id`: UUID (Primary Key)
  - `actorId`: UUID (Foreign Key -> `User.id`, ON DELETE CASCADE)
  - `action`: Enum `AuditAction`
  - `targetType`: String
  - `targetId`: String
  - `workspaceId`: UUID (Foreign Key -> `Workspace.id`, ON DELETE SET NULL, Nullable)
  - `requestId`: String (Nullable, Indexed for correlation tracking)
  - `metadata`: JSONB (Nullable, strictly sanitized/redacted)
  - `ip`: String (Nullable)
  - `userAgent`: String (Nullable)
  - `chainHash`: String (Nullable, Indexed, for tamper-evidence via hash chaining)
  - `actorType`: String (Default `USER`, values: USER, PLATFORM_STAFF, SYSTEM)
  - `grantId`: String (Nullable, Indexed, reference to PrivilegedAccessGrant for break-glass tracking)
  - `outcome`: String (Default `SUCCESS`, values: SUCCESS, FAILURE)
  - `createdAt`: Timestamp with timezone (default `now()`, Indexed)

---

## 4. Deletion & Retention Policies

| Model | Parent Relationship | Policy | Justification |
|---|---|---|---|
| `UserProfile` | `User` | `CASCADE` | User profile data cannot outlive user account. |
| `RefreshToken` | `User` | `CASCADE` | Authentication sessions must be revoked on account deletion. |
| `WorkspaceMember` | `Workspace` / `User` | `CASCADE` | Memberships drop with either workspace or user account. |
| `Workspace` | `User` (`ownerId`) | `RESTRICT` | Primary workspace owner cannot be deleted without reassigning ownership. |
| `WorkspaceInvitation` | `Workspace` | `CASCADE` | Pending invitations are invalidated on workspace purge. |
| `AuditLog` | `Workspace` | `SET NULL` | Audit history is immutable and retained even if workspace tenant is removed. |
| `AuditLog` | Application Layer | `APPEND-ONLY` | API exposes zero update or delete endpoints for `AuditLog`. |

---

## 5. Indexing & Multi-Tenant Strategy

1. **Foreign Key Indexes**: Every tenant-owned table (`WorkspaceMember`, `WorkspaceInvitation`, and Phase 3 tables `Client`, `Project`, `Task`) includes an index on `(workspaceId)`.
2. **Composite Query Indexes**:
   - `(workspaceId, createdAt DESC)` for paginated listings.
   - `(workspaceId, role)` for membership role lookups.
   - `(workspaceId, status)` for filtered views.
3. **Tenant Scoping Guard**: No database query is executed without an explicit `workspaceId` condition matching the authenticated session's verified workspace membership.

---

## 6. Migration & Maintenance Strategy

- Migrations are managed strictly via Prisma Migrate (`pnpm prisma migrate deploy` in production CI/CD).
- Production migrations must always be non-destructive and backwards-compatible.
- Seeds under `database/seeds/seed.ts` provide reproducible test scenarios with dummy workspaces and authenticated mock accounts. Seeds refuse to execute in production.

---

## 7. Phase 3 Domain Schema

`Client`, `Project`, `Task`, `ActivityEvent`, and `WorkspaceSettings` are workspace-owned. Their Prisma schema and visual ERD are maintained together in [`database/docs/ERD.md`](../database/docs/ERD.md).

| Model | Lifecycle and fields | Workspace constraints |
|---|---|---|
| `Client` | Name, contact fields, `ACTIVE` / `ARCHIVED`, creator, timestamps, nullable `deletedAt` | Workspace/status and workspace/createdAt indexes |
| `Project` | Optional client, name, description, `PLANNING` / `ACTIVE` / `ON_HOLD` / `COMPLETED` / `ARCHIVED`, dates, creator, timestamps, nullable `deletedAt` | Composite `(workspaceId, clientId)` foreign key; workspace/status, workspace/client, workspace/createdAt indexes |
| `Task` | Required project, optional assignee, title, description, `TODO` / `IN_PROGRESS` / `REVIEW` / `DONE`, priority, due date, creator, timestamps, nullable `deletedAt` | Composite `(workspaceId, projectId)` and `(workspaceId, assigneeId)` foreign keys; workspace/status, workspace/project, workspace/assignee, workspace/dueDate, workspace/createdAt indexes |
| `ActivityEvent` | Nullable actor, entity type/id, action, safe metadata, timestamp | Workspace foreign key; workspace/createdAt and entity indexes |
| `WorkspaceSettings` | Per-workspace company name/email and JSON configuration | Unique workspace ID and workspace foreign key |

The Task assignee foreign key points to `(WorkspaceMember.workspaceId, WorkspaceMember.userId)`; the domain service also verifies the membership is `ACTIVE` when assigning. Service validation and relational constraints both reject cross-workspace references.

### Status transitions

- Project: `PLANNING -> ACTIVE`; `ACTIVE -> ON_HOLD | COMPLETED`; `ON_HOLD -> ACTIVE`. `COMPLETED` has no normal transition. Archiving uses a separate admin-only operation and is allowed only after active tasks are archived; restoring sets the project to `ACTIVE`.
- Task: `TODO -> IN_PROGRESS`; `IN_PROGRESS -> REVIEW | TODO`; `REVIEW -> DONE | IN_PROGRESS`; `DONE -> TODO | IN_PROGRESS` (explicit reopen). Task creation starts at `TODO`.
- Client: `ACTIVE -> ARCHIVED` and restore to `ACTIVE`. A client cannot be archived while it has a non-archived project.

Archiving is a soft delete: `deletedAt` is set, rows and their history are retained, and child records are never cascaded. Projects cannot be archived while they have non-archived tasks. Hard deletion/retention cleanup is outside Phase 3.

Every mutation writes its ActivityEvent and corresponding domain AuditLog in the same database transaction. The request correlation ID is included in ActivityEvent metadata and `AuditLog.requestId`; metadata contains operation/status identifiers only, not client contact details or task descriptions.

### Neon connections and safe testing

Runtime Prisma queries use pooled `DATABASE_URL`; migrations use direct `DIRECT_URL`. Runtime URLs receive bounded defaults of `connection_limit=5`, `pool_timeout=10`, and `connect_timeout=10` when not specified. Integration tests require both `DATABASE_URL_TEST` and `DIRECT_URL_TEST` and do not fall back to runtime URLs. These values must point to a disposable, non-production Neon branch.

---

## 8. Phase 8 Platform Management Schema

Phase 8 adds platform administration, feature flags, entitlements, and privileged access management:

|| Model | Purpose | Key Fields |
||---|---|---|
|| `FeatureFlag` | Server-authoritative feature flags with targeting | key, description, type, defaultValue, rules (JSONB), status, chainHash |
|| `FeatureFlagChange` | History of all flag changes | flagId, actorId, reason, before/after state |
|| `Plan` | Plan definitions with limits | key, name, limits (JSONB) |
|| `Entitlement` | Per-workspace plan assignments with overrides | workspaceId, planId, effectiveFrom, effectiveTo, overrides (JSONB) |
|| `PrivilegedAccessGrant` | Break-glass access grants for support | requesterId, targetWorkspaceId, reason, scope, status, approverId, startsAt, expiresAt, revokedAt |

### Feature Flag Targeting
Rules support scoped evaluation in order: global → plan → workspace → user. Cache keys are tenant-scoped (`flag:{key}:workspace:{id}:plan:{id}`) to prevent cross-tenant cache poisoning.

### Entitlement Limits
Plan limits stored as JSONB include: seats, projects, storage (bytes), AI quota (daily requests/tokens), and feature flags. Per-workspace overrides take precedence.

### Break-Glass Grants
- Status: PENDING, ACTIVE, REVOKED, EXPIRED
- Low-scope grants (read:aggregate) can be auto-approved by SUPERADMIN/PLATFORM_ADMIN
- High-scope grants (full) require two-person approval
- Grants auto-expire at `expiresAt`
- All access under a grant is audited with `grantId`
