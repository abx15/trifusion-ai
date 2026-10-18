# TriFusion AI — Entity Relationship Diagram (ERD)

> **Database Engine:** PostgreSQL 15+  
> **Schema Management:** Prisma ORM  
> **Last Updated:** Phase 2 (Identity & Multi-Tenancy)

---

## 1. High-Level Entity Diagram

```mermaid
erDiagram
    User ||--o| UserProfile : "has profile"
    User ||--o{ RefreshToken : "owns tokens"
    User ||--o{ PasswordResetToken : "requests resets"
    User ||--o{ EmailVerificationToken : "verifies email"
    User ||--o{ WorkspaceMember : "participates in"
    User ||--o{ Workspace : "owns (as creator)"
    User ||--o{ WorkspaceInvitation : "sends invitations"
    User ||--o{ PlatformStaffRole : "assigned platform roles"
    User ||--o{ AuditLog : "initiates actions (actor)"

    Workspace ||--o{ WorkspaceMember : "contains memberships"
    Workspace ||--o{ WorkspaceInvitation : "issues invitations"
    Workspace ||--o{ AuditLog : "targeted by audit logs"

    User {
        string id PK
        string email UK
        string passwordHash
        string idpSubject UK
        boolean isEmailVerified
        enum status "ACTIVE | SUSPENDED | DELETED"
        datetime createdAt
        datetime updatedAt
    }

    UserProfile {
        string id PK
        string userId FK,UK
        string firstName
        string lastName
        string avatarUrl
        string timezone
        string locale
        datetime createdAt
        datetime updatedAt
    }

    Workspace {
        string id PK
        string name
        string slug UK
        enum type "PERSONAL | COMPANY"
        enum status "ACTIVE | SUSPENDED | ARCHIVED"
        string ownerId FK
        datetime createdAt
        datetime updatedAt
    }

    WorkspaceMember {
        string id PK
        string workspaceId FK
        string userId FK
        enum role "OWNER | TEAM_ADMIN | MEMBER | VIEWER"
        enum status "ACTIVE | SUSPENDED"
        datetime joinedAt
        datetime createdAt
    }

    WorkspaceInvitation {
        string id PK
        string workspaceId FK
        string email
        enum role "OWNER | TEAM_ADMIN | MEMBER | VIEWER"
        string tokenHash UK
        string inviterId FK
        enum status "PENDING | ACCEPTED | REVOKED | EXPIRED"
        datetime expiresAt
        datetime acceptedAt
        datetime revokedAt
        datetime createdAt
    }

    PlatformStaffRole {
        string id PK
        string userId FK
        enum role "SUPERADMIN | PLATFORM_ADMIN | ANALYST | SUPPORT_AGENT"
        enum status "ACTIVE | INACTIVE | SUSPENDED"
        string grantedBy
        datetime grantedAt
        datetime revokedAt
        string reason
        datetime createdAt
        datetime updatedAt
    }

    AuditLog {
        string id PK
        string actorId FK
        enum action
        string targetType
        string targetId
        string workspaceId FK
        string requestId
        json metadata
        string ip
        string userAgent
        datetime createdAt
    }

    RefreshToken {
        string id PK
        string userId FK
        string tokenHash UK
        string deviceInfo
        datetime expiresAt
        boolean isRevoked
        datetime createdAt
    }

    PasswordResetToken {
        string id PK
        string userId FK
        string tokenHash UK
        datetime expiresAt
        datetime usedAt
        datetime createdAt
    }

    EmailVerificationToken {
        string id PK
        string userId FK
        string tokenHash UK
        datetime expiresAt
        datetime usedAt
        datetime createdAt
    }
```

---

## 2. Integrity & Deletion Policies

| Parent Model | Dependent Model | Relation | Deletion Strategy | Rationale |
|---|---|---|---|---|
| `User` | `UserProfile` | `1 : 1` | `CASCADE` | Profile data cannot exist without its base user. |
| `User` | `RefreshToken` | `1 : N` | `CASCADE` | All session tokens must purge if the user is deleted. |
| `User` | `PasswordResetToken` | `1 : N` | `CASCADE` | Reset tokens are invalid if user account is pruned. |
| `User` | `EmailVerificationToken` | `1 : N` | `CASCADE` | Verification tokens purge with user. |
| `User` | `WorkspaceMember` | `1 : N` | `CASCADE` | Membership records remove on user deletion. |
| `User` | `PlatformStaffRole` | `1 : N` | `CASCADE` | Internal roles drop with user identity. |
| `User` | `Workspace` (`ownerId`) | `1 : N` | `RESTRICT` | A user cannot be deleted while registered as sole workspace owner without ownership transfer. |
| `Workspace` | `WorkspaceMember` | `1 : N` | `CASCADE` | When workspace is deleted, its memberships are removed. |
| `Workspace` | `WorkspaceInvitation`| `1 : N` | `CASCADE` | Invitations to a deleted workspace are immediately purged. |
| `Workspace` | `AuditLog` | `1 : N` | `SET NULL` | Audit records must remain intact for compliance even if workspace is deleted. |
| `User` (`actorId`) | `AuditLog` | `1 : N` | `CASCADE` | GDPR/compliance hard-delete cascading for test actors (in production, soft-delete is enforced). |

---

## 3. Phase 3 Workspace Domain

```mermaid
erDiagram
    Workspace ||--o{ Client : owns
    Workspace ||--o{ Project : owns
    Workspace ||--o{ Task : owns
    Workspace ||--o{ ActivityEvent : records
    Workspace ||--|| WorkspaceSettings : configures
    Workspace ||--o{ WorkspaceMember : contains
    User ||--o{ Client : creates
    User ||--o{ Project : creates
    User ||--o{ Task : creates
    User o|--o{ ActivityEvent : acts
    Client o|--o{ Project : serves
    Project ||--o{ Task : groups
    WorkspaceMember o|--o{ Task : assignee

    Client {
        string id PK
        string workspaceId FK
        string createdBy FK
        string name
        string email
        string phone
        string status
        datetime deletedAt
    }
    Project {
        string id PK
        string workspaceId FK
        string clientId FK
        string createdBy FK
        string name
        string status
        datetime startDate
        datetime endDate
        datetime deletedAt
    }
    Task {
        string id PK
        string workspaceId FK
        string projectId FK
        string assigneeId FK
        string createdBy FK
        string title
        string status
        string priority
        datetime dueDate
        datetime deletedAt
    }
    ActivityEvent {
        string id PK
        string workspaceId FK
        string actorId FK
        string entityType
        string entityId
        string action
        json metadata
        datetime createdAt
    }
    WorkspaceSettings {
        string id PK
        string workspaceId FK
        string companyName
        string companyEmail
        json settings
    }
```

`Project(workspaceId, clientId)` references `Client(workspaceId, id)`. `Task(workspaceId, projectId)` references `Project(workspaceId, id)` and `Task(workspaceId, assigneeId)` references `WorkspaceMember(workspaceId, userId)`. Assignment additionally requires an active membership in the domain service.

Every domain table has workspace and workload indexes. Soft-archiving sets `deletedAt` and retains child history; active tasks block project archival, and active projects block client archival. See [`DATABASE_DESIGN.md`](../../docs/DATABASE_DESIGN.md) for allowed status transitions and retention rules.
