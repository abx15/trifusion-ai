# TriFusion AI — Data Dictionary

> **Target Database:** PostgreSQL 15+  
> **ORM:** Prisma v5  
> **Schema Location:** `database/prisma/schema.prisma`

---

## 1. Tables & Columns Reference

### 1.1 `User`
Primary identity source-of-truth across the entire monorepo.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` (UUID) | PRIMARY KEY, `uuid()` | Unique identifier for user. |
| `email` | `TEXT` | UNIQUE, NOT NULL, INDEX | Primary email, case-insensitive normalized. |
| `passwordHash` | `TEXT` | NULLABLE | Bcrypt work factor 12 hash. Null for OAuth accounts. |
| `idpSubject` | `TEXT` | UNIQUE, NULLABLE | External identity provider subject ID. |
| `isEmailVerified`| `BOOLEAN` | DEFAULT `false`, NOT NULL | Status of email verification. |
| `status` | `UserStatus` | DEFAULT `ACTIVE`, NOT NULL, INDEX | Status: `ACTIVE`, `SUSPENDED`, `DELETED`. |
| `createdAt` | `TIMESTAMP(3)` | DEFAULT `now()`, NOT NULL | Account creation timestamp. |
| `updatedAt` | `TIMESTAMP(3)` | NOT NULL, `updatedAt` | Last modification timestamp. |

### 1.2 `UserProfile`
User biographical and localization preferences.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` (UUID) | PRIMARY KEY, `uuid()` | Profile record ID. |
| `userId` | `TEXT` (UUID) | UNIQUE, NOT NULL, FK -> `User.id` (ON DELETE CASCADE) | Owning user ID. |
| `firstName` | `TEXT` | NOT NULL | First name. |
| `lastName` | `TEXT` | NOT NULL | Last name. |
| `avatarUrl` | `TEXT` | NULLABLE | URL to avatar image in object storage. |
| `timezone` | `TEXT` | DEFAULT `'UTC'`, NOT NULL | IANA timezone identifier. |
| `locale` | `TEXT` | DEFAULT `'en'`, NOT NULL | Preferred ISO locale code. |
| `createdAt` | `TIMESTAMP(3)` | DEFAULT `now()`, NOT NULL | Profile creation date. |
| `updatedAt` | `TIMESTAMP(3)` | NOT NULL, `updatedAt` | Profile update date. |

### 1.3 `Workspace`
Multi-tenant boundary for clients, projects, tasks, and team collaboration.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` (UUID) | PRIMARY KEY, `uuid()` | Workspace unique ID. |
| `name` | `TEXT` | NOT NULL | Human-readable name. |
| `slug` | `TEXT` | UNIQUE, NOT NULL, INDEX | URL-safe slug. |
| `type` | `WorkspaceType`| DEFAULT `PERSONAL`, NOT NULL, INDEX | `PERSONAL` or `COMPANY`. |
| `status` | `WorkspaceStatus`| DEFAULT `ACTIVE`, NOT NULL, INDEX | `ACTIVE`, `SUSPENDED`, `ARCHIVED`. |
| `ownerId` | `TEXT` (UUID) | NOT NULL, INDEX, FK -> `User.id` (ON DELETE RESTRICT) | User ID of primary owner. |
| `createdAt` | `TIMESTAMP(3)` | DEFAULT `now()`, NOT NULL | Workspace creation date. |
| `updatedAt` | `TIMESTAMP(3)` | NOT NULL, `updatedAt` | Workspace update date. |

### 1.4 `WorkspaceMember`
Associates users with workspaces and grants tenant-scoped roles.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` (UUID) | PRIMARY KEY, `uuid()` | Membership record ID. |
| `workspaceId` | `TEXT` (UUID) | NOT NULL, INDEX, FK -> `Workspace.id` (ON DELETE CASCADE) | Workspace tenant ID. |
| `userId` | `TEXT` (UUID) | NOT NULL, INDEX, FK -> `User.id` (ON DELETE CASCADE) | Member user ID. |
| `role` | `WorkspaceRole`| DEFAULT `MEMBER`, NOT NULL | `OWNER`, `TEAM_ADMIN`, `MEMBER`, `VIEWER`. |
| `status` | `WorkspaceMemberStatus` | DEFAULT `ACTIVE`, NOT NULL, INDEX | `ACTIVE` or `SUSPENDED`. |
| `joinedAt` | `TIMESTAMP(3)` | DEFAULT `now()`, NOT NULL | Timestamp when user joined. |
| `createdAt` | `TIMESTAMP(3)` | DEFAULT `now()`, NOT NULL | Membership row creation timestamp. |
| *(Composite)* | `(workspaceId, userId)` | UNIQUE | Ensures a user only has 1 membership per workspace. |
| *(Composite)* | `(workspaceId, role)` | INDEX | Fast role lookup within a workspace. |

### 1.5 `WorkspaceInvitation`
Pending, accepted, revoked, or expired workspace team invitations.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` (UUID) | PRIMARY KEY, `uuid()` | Invitation ID. |
| `workspaceId` | `TEXT` (UUID) | NOT NULL, INDEX, FK -> `Workspace.id` (ON DELETE CASCADE) | Workspace ID. |
| `email` | `TEXT` | NOT NULL, INDEX | Recipient email. |
| `role` | `WorkspaceRole`| DEFAULT `MEMBER`, NOT NULL | Proposed role upon acceptance. |
| `tokenHash` | `TEXT` | UNIQUE, NOT NULL | SHA-256 hash of random invite token. |
| `inviterId` | `TEXT` (UUID) | NOT NULL, FK -> `User.id` (ON DELETE RESTRICT) | User who sent the invite. |
| `status` | `WorkspaceInvitationStatus` | DEFAULT `PENDING`, NOT NULL, INDEX | `PENDING`, `ACCEPTED`, `REVOKED`, `EXPIRED`. |
| `expiresAt` | `TIMESTAMP(3)` | NOT NULL, INDEX | Expiration timestamp. |
| `acceptedAt` | `TIMESTAMP(3)` | NULLABLE | Acceptance timestamp. |
| `revokedAt` | `TIMESTAMP(3)` | NULLABLE | Revocation timestamp. |
| `createdAt` | `TIMESTAMP(3)` | DEFAULT `now()`, NOT NULL | Invitation issuance date. |
| *(Composite)* | `(workspaceId, email)` | UNIQUE | Only 1 active invitation per email per workspace. |

### 1.6 `PlatformStaffRole`
Internal staff administrative roles completely decoupled from workspace roles.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` (UUID) | PRIMARY KEY, `uuid()` | Staff assignment ID. |
| `userId` | `TEXT` (UUID) | NOT NULL, FK -> `User.id` (ON DELETE CASCADE) | Staff user ID. |
| `role` | `PlatformStaffRoleType`| NOT NULL, INDEX | `SUPERADMIN`, `PLATFORM_ADMIN`, `ANALYST`, `SUPPORT_AGENT`. |
| `status` | `PlatformStaffStatus` | DEFAULT `ACTIVE`, NOT NULL, INDEX | `ACTIVE`, `INACTIVE`, `SUSPENDED`. |
| `grantedBy` | `TEXT` | NULLABLE | Actor who granted the role. |
| `grantedAt` | `TIMESTAMP(3)` | DEFAULT `now()`, NOT NULL | Timestamp when role was assigned. |
| `revokedAt` | `TIMESTAMP(3)` | NULLABLE | Timestamp when role was revoked. |
| `reason` | `TEXT` | NULLABLE | Business or security justification. |
| `createdAt` | `TIMESTAMP(3)` | DEFAULT `now()`, NOT NULL | Record creation date. |
| `updatedAt` | `TIMESTAMP(3)` | NOT NULL, `updatedAt` | Record update date. |
| *(Composite)* | `(userId, role)` | UNIQUE | Prevents duplicate role assignments. |

### 1.7 `AuditLog`
Append-only log of security-sensitive operations across auth, tenancy, and platform domains.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` (UUID) | PRIMARY KEY, `uuid()` | Log entry ID. |
| `actorId` | `TEXT` (UUID) | NOT NULL, INDEX, FK -> `User.id` (ON DELETE CASCADE) | Actor user ID. |
| `action` | `AuditAction` | NOT NULL, INDEX | Action performed. |
| `targetType` | `TEXT` | NOT NULL | Type of entity affected (e.g., `Workspace`, `User`). |
| `targetId` | `TEXT` | NOT NULL | ID of entity affected. |
| `workspaceId` | `TEXT` (UUID) | NULLABLE, INDEX, FK -> `Workspace.id` (ON DELETE SET NULL)| Associated workspace tenant ID. |
| `requestId` | `TEXT` | NULLABLE, INDEX | Correlation ID from request headers. |
| `metadata` | `JSONB` | NULLABLE | Redacted contextual metadata payload. |
| `ip` | `TEXT` | NULLABLE | Client IP address. |
| `userAgent` | `TEXT` | NULLABLE | Client user agent string. |
| `createdAt` | `TIMESTAMP(3)` | DEFAULT `now()`, NOT NULL, INDEX | Timestamp of event. |

---

## 2. Authentication Tokens

### 2.1 `RefreshToken`
Stores rotating refresh tokens hashed with SHA-256.
- `id` (UUID, PK)
- `userId` (FK -> `User.id`, ON DELETE CASCADE)
- `tokenHash` (Unique)
- `deviceInfo` (Nullable text)
- `expiresAt` (Timestamp, Indexed)
- `isRevoked` (Boolean, default `false`)
- `createdAt` (Timestamp)

### 2.2 `PasswordResetToken`
Single-use password reset tokens.
- `id` (UUID, PK)
- `userId` (FK -> `User.id`, ON DELETE CASCADE)
- `tokenHash` (Unique)
- `expiresAt` (Timestamp, Indexed)
- `usedAt` (Nullable timestamp)
- `createdAt` (Timestamp)

### 2.3 `EmailVerificationToken`
Single-use email verification tokens.
- `id` (UUID, PK)
- `userId` (FK -> `User.id`, ON DELETE CASCADE)
- `tokenHash` (Unique)
- `expiresAt` (Timestamp, Indexed)
- `usedAt` (Nullable timestamp)
- `createdAt` (Timestamp)
