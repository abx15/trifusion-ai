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
  - `id`: UUID (Primary Key)
  - `name`: String
  - `slug`: String (Unique index)
  - `type`: Enum `PERSONAL` | `COMPANY`
  - `ownerId`: UUID (Foreign Key -> `User.id`)
  - `logoUrl`: String (Nullable)
  - `createdAt`: Timestamp with timezone
  - `updatedAt`: Timestamp with timezone

- **`WorkspaceMember`**:
  - `id`: UUID (Primary Key)
  - `workspaceId`: UUID (Foreign Key -> `Workspace.id`, ON DELETE CASCADE)
  - `userId`: UUID (Foreign Key -> `User.id`, ON DELETE CASCADE)
  - `role`: Enum `OWNER` | `TEAM_ADMIN` | `MEMBER` | `VIEWER`
  - `createdAt`: Timestamp with timezone
  - Unique Constraint: `(workspaceId, userId)`

- **`WorkspaceInvitation`**:
  - `id`: UUID (Primary Key)
  - `workspaceId`: UUID (Foreign Key -> `Workspace.id`, ON DELETE CASCADE)
  - `email`: String
  - `role`: Enum `OWNER` | `TEAM_ADMIN` | `MEMBER` | `VIEWER`
  - `tokenHash`: String (Unique)
  - `inviterId`: UUID (Foreign Key -> `User.id`)
  - `status`: Enum `PENDING` | `ACCEPTED` | `REVOKED` | `EXPIRED`
  - `expiresAt`: Timestamp with timezone
  - `createdAt`: Timestamp with timezone

---

## 4. Indexing & Multi-Tenant Strategy

1. **Foreign Key Indexes**: Every tenant-owned table (`Client`, `Project`, `Task`, `ActivityEvent`, etc.) includes an index on `(workspaceId)`.
2. **Composite Query Indexes**:
   - `(workspaceId, createdAt DESC)` for paginated listings.
   - `(workspaceId, status)` for filtered views.
   - `(workspaceId, assigneeId)` for task assignment views.
3. **Tenant Scoping Guard**: No database query is executed without an explicit `workspaceId` condition matching the authenticated session's verified workspace membership.

---

## 5. Migration & Maintenance Strategy

- Migrations are managed strictly via Prisma Migrate (`pnpm prisma migrate dev` in development and `pnpm prisma migrate deploy` in production CI/CD).
- Production migrations must always be non-destructive and backwards-compatible.
- Seeds under `database/seeds/seed.ts` provide reproducible test scenarios with dummy workspaces and authenticated mock accounts.
