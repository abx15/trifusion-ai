# TriFusion AI — Architecture Diagrams

This document contains Mermaid diagrams illustrating the system architecture, data flows, authentication, authorization, deployment, and database relationships for TriFusion AI.

> **Tip:** These diagrams render in GitHub, GitLab, VS Code (with Mermaid extensions), and most Markdown viewers that support Mermaid.

---

## 1. System Architecture (High-Level)

```mermaid
graph TD
    subgraph Client_Layer["Client Layer (Browser)"]
        W[Web Dashboard<br/>Next.js 16<br/>Port 3000]
        P[Platform Admin<br/>Next.js 16<br/>Port 3002]
    end

    subgraph API_Layer["API Layer (NestJS 10)"]
        API[API Server<br/>Port 3001]
        REST[REST Routes<br/>`/api/v1/*`]
        GQL[GraphQL<br/>`/graphql`]
        SW[Swagger UI<br/>`/api/docs`]
    end

    subgraph Auth_Zone["Authentication & Authorization Zone"]
        JWT[JWT Verification<br/>15 min access token]
        RT[Refresh Token<br/>7 days, HttpOnly cookie]
        POL[PolicyService<br/>RBAC Enforcement]
        GUARD[JwtAuthGuard<br/>Role Guards]
    end

    subgraph Service_Zone["Domain Services Zone"]
        AUTH[Auth Service]
        WS[Workspace Service]
        CLI[Client Service]
        PRJ[Project Service]
        TSK[Task Service]
        ACT[Activity Service]
        PLT[Platform Service]
        AI_SVC[AI Service<br/>NestJS adapter]
    end

    subgraph Data_Zone["Data Zone"]
        DB[(Neon PostgreSQL<br/>Prisma ORM<br/>22 models)]
        REDIS[(Redis<br/>BullMQ queues)]
        S3[(S3-Compatible<br/>Object Storage)]
    end

    subgraph AI_Service["AI Service (Optional)"]
        DJ[Django AI<br/>Port 8000<br/>Python/Django]
    end

    %% Client connections
    W -->|REST + GraphQL<br/>Same-origin proxy| API
    P -->|REST<br/>Same-origin proxy| API

    %% API internal
    API --> REST
    API --> GQL
    API --> SW
    API --> GUARD
    GUARD --> POL
    POL --> JWT
    POL --> RT

    %% Service calls
    REST --> AUTH
    REST --> WS
    REST --> CLI
    REST --> PRJ
    REST --> TSK
    REST --> ACT
    REST --> PLT
    REST --> AI_SVC

    GQL --> WS
    GQL --> PRJ
    GQL --> TSK
    GQL --> ACT

    %% Data layer
    AUTH --> DB
    WS --> DB
    CLI --> DB
    PRJ --> DB
    TSK --> DB
    ACT --> DB
    PLT --> DB
    AI_SVC --> DJ

    %% External
    DB --> REDIS
    AUTH --> S3

    style API_Layer fill:#003F5C,stroke:#333,stroke-width:2px,color:#fff
    style Auth_Zone fill:#FF6361,stroke:#333,stroke-width:2px,color:#fff
    style Data_Zone fill:#58508D,stroke:#333,stroke-width:2px,color:#fff
    style AI_Service fill:#8A508F,stroke:#333,stroke-width:2px,color:#fff
```

---

## 2. Request Lifecycle (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    participant U as User (Browser)
    participant FE as Next.js Frontend<br/>(Web or Platform-Admin)
    participant PR as API Proxy<br/>`/api/backend/*`
    participant API as NestJS API<br/>(Port 3001)
    participant GUARD as JwtAuthGuard
    participant POL as PolicyService
    participant DB as Neon PostgreSQL

    U->>FE: Navigate to /dashboard
    FE->>PR: GET /api/backend/...<br/>+ HttpOnly cookies
    PR->>API: Forward request<br/>+ Bearer access token
    API->>GUARD: Validate JWT signature + expiry
    GUARD-->>API: UserId + claims
    API->>POL: requireWorkspaceRole/<br/>requirePlatformRole
    POL->>DB: SELECT user, membership,<br/>workspace, staff role
    DB-->>POL: User context (active, role,<br/>workspaceId, permissions)
    POL-->>API: Authorization decision
    API->>DB: Prisma query with<br/>workspaceId tenant filter
    DB-->>API: Resource data
    API-->>PR: JSON response
    PR-->>FE: Strip auth tokens,<br/>forward body + status
    FE-->>U: Render page / dashboard
```

---

## 3. Authentication Flow

```mermaid
flowchart TD
    Start([User visits<br/>/login]) --> LoginForm[Display login form<br/>email + password]
    LoginForm --> Submit[User submits credentials]
    Submit --> APICall[POST /api/v1/auth/login<br/>via API proxy]
    APICall --> Validate{Credentials valid?}
    Validate -->|No| Reject[Return 401<br/>Invalid email or password]
    Reject --> LoginForm
    Validate -->|Yes| IssueTokens[Issue JWT access token<br/>15 min + refresh token 7 days]
    IssueTokens --> SetCookies[Set HttpOnly, Secure,<br/>SameSite=Strict cookies]
    SetCookies --> Redirect[Redirect to /dashboard<br/>with ?next param]
    Redirect --> Dashboard[Load dashboard<br/>fetch workspace data]

    Dashboard --> CheckToken{Access token<br/>expired?}
    CheckToken -->|Yes| Refresh[POST /api/v1/auth/refresh<br/>use refresh token]
    Refresh -->|Success| NewToken[Set new access token cookie<br/>retry original request]
    Refresh -->|Failed| Logout[Clear cookies<br/>redirect to /login]
    NewToken --> Dashboard
    Logout --> LoginForm

    style Reject fill:#FF6361,stroke:#333,color:#fff
    style Logout fill:#FF6361,stroke:#333,color:#fff
    style IssueTokens fill:#003F5C,stroke:#333,color:#fff
    style Start fill:#58508D,stroke:#333,color:#fff
```

---

## 4. Authorization Decision Flow

```mermaid
flowchart TD
    Start([HTTP request arrives]) --> Ctx[Extract userId from<br/>verified JWT]
    Ctx --> Layer{Request targets<br/>workspace or platform?}

    Layer -->|Workspace| WSPath[Workspace Layer]
    Layer -->|Platform| PLPath[Platform Staff Layer]

    WSPath --> WSResolve[PolicyService.resolveUser()<br/>check user is ACTIVE]
    WSResolve --> WSContext[getWorkspaceContext()<br/>check membership ACTIVE +<br/>workspace ACTIVE]
    WSContext --> WSHierarchy[Compare ROLE_HIERARCHY<br/>context.role >= requiredRole]
    WSHierarchy --> WSPass{Role sufficient?}
    WSPass -->|No| WS403[Return 403 Forbidden]
    WSPass -->|Yes| WSService[Domain Service<br/>Prisma query with workspaceId filter]

    PLPath --> PLResolve[getPlatformStaffContext()<br/>check staff role ACTIVE]
    PLResolve --> PLHierarchy[Compare PLATFORM_ROLE_HIERARCHY<br/>context.role >= requiredRole]
    PLHierarchy --> PLPass{Role sufficient?}
    PLPass -->|No| PL403[Return 403 Forbidden]
    PLPass -->|Yes| PLService[Domain Service<br/>platform-scoped query]

    WSService --> DB[(Neon PostgreSQL)]
    PLService --> DB
    DB --> Result[Return data to controller]
    Result --> Response[Return JSON response]

    style WS403 fill:#FF6361,stroke:#333,color:#fff
    style PL403 fill:#FF6361,stroke:#333,color:#fff
    style WSService fill:#003F5C,stroke:#333,color:#fff
    style PLService fill:#58508D,stroke:#333,color:#fff
```

---

## 5. Role Separation (Two Disjoint Layers)

```mermaid
graph LR
    subgraph CW["Customer Workspace Layer<br/>apps/web — Port 3000"]
        direction TB
        OWNER[OWNER<br/>Level 4<br/>Full control]
        TADMIN[TEAM_ADMIN<br/>Level 3<br/>Team admin]
        MEMBER[MEMBER<br/>Level 2<br/>Create/edit resources]
        VIEWER[VIEWER<br/>Level 1<br/>Read-only]
    end

    subgraph PS["Platform Staff Layer<br/>apps/platform-admin — Port 3002"]
        direction TB
        SADMIN[SUPERADMIN<br/>Level 4<br/>Platform config]
        PADMIN[PLATFORM_ADMIN<br/>Level 3<br/>Tenant/user ops]
        ANALYST[ANALYST<br/>Level 1<br/>Analytics & reporting]
        SUPPORT[SUPPORT_AGENT<br/>Level 2<br/>Bounded support]
    end

    CW -.->|Strictly disjoint<br/>no namespace overlap| PS

    style CW fill:#003F5C,stroke:#333,stroke-width:2px,color:#fff
    style PS fill:#FF6361,stroke:#333,stroke-width:2px,color:#fff
```

---

## 6. Database Entity Relationship (ERD)

```mermaid
erDiagram
    USER ||--o{ USER_PROFILE : "has one"
    USER ||--o{ REFRESH_TOKEN : "has many"
    USER ||--o{ PASSWORD_RESET_TOKEN : "has many"
    USER ||--o{ EMAIL_VERIFICATION_TOKEN : "has many"
    USER ||--o{ WORKSPACE_MEMBER : "member of many"
    USER ||--o{ PLATFORM_STAFF_ROLE : "has many"
    USER ||--o{ WORKSPACE : "owns many"
    USER ||--o{ WORKSPACE_INVITATION : "invites many"
    USER ||--o{ AUDIT_LOG : "acts in many"
    USER ||--o{ CLIENT : "creates many"
    USER ||--o{ PROJECT : "creates many"
    USER ||--o{ TASK : "creates many"
    USER ||--o{ ACTIVITY_EVENT : "performs many"
    USER ||--o{ NOTIFICATION : "receives many"

    WORKSPACE ||--o{ WORKSPACE_MEMBER : "has many members"
    WORKSPACE ||--o{ WORKSPACE_INVITATION : "has many invitations"
    WORKSPACE ||--o{ AUDIT_LOG : "has many audit logs"
    WORKSPACE ||--o{ CLIENT : "contains many"
    WORKSPACE ||--o{ PROJECT : "contains many"
    WORKSPACE ||--o{ TASK : "contains many"
    WORKSPACE ||--o{ ACTIVITY_EVENT : "has many events"
    WORKSPACE ||--o{ WORKSPACE_SETTINGS : "has one settings"
    WORKSPACE ||--o{ NOTIFICATION : "sends many"
    WORKSPACE ||--o{ ENTITLEMENT : "has one entitlement"
    WORKSPACE ||--o{ PRIVILEGED_ACCESS_GRANT : "target of many"
    WORKSPACE ||--o{ FILE_ASSET : "contains many"
    WORKSPACE ||--o{ JOB_RECORD : "has many jobs"

    WORKSPACE_MEMBER }o--|| USER : "belongs to user"
    WORKSPACE_MEMBER }o--|| WORKSPACE : "belongs to workspace"
    WORKSPACE_MEMBER ||--o{ TASK : "assigned to many"

    CLIENT ||--o{ PROJECT : "has many projects"
    PROJECT ||--o{ TASK : "has many tasks"
    TASK }o--|| WORKSPACE_MEMBER : "assigned to member"

    PLAN ||--o{ ENTITLEMENT : "defines"
    ENTITLEMENT }o--|| WORKSPACE : "assigned to"
    FEATURE_FLAG ||--o{ FEATURE_FLAG_CHANGE : "has changes"

    PRIVILEGED_ACCESS_GRANT }o--|| USER : "requested by"
    PRIVILEGED_ACCESS_GRANT }o--|| WORKSPACE : "target workspace"

    USER_PROFILE {
        string id PK
        string userId UK FK
        string firstName
        string lastName
        string avatarUrl
        string timezone
        string locale
    }

    USER {
        string id PK
        string email UK
        string passwordHash
        string idpSubject UK
        boolean isEmailVerified
        enum UserStatus status
        datetime createdAt
        datetime updatedAt
    }

    WORKSPACE {
        string id PK
        string name
        string slug UK
        enum WorkspaceType type
        enum WorkspaceStatus status
        string ownerId FK
        datetime createdAt
    }

    WORKSPACE_MEMBER {
        string id PK
        string workspaceId FK
        string userId FK
        enum WorkspaceRole role
        enum WorkspaceMemberStatus status
        datetime joinedAt
    }

    CLIENT {
        string id PK
        string workspaceId FK
        string name
        string email
        string phone
        enum ClientStatus status
        string createdBy FK
        datetime deletedAt
    }

    PROJECT {
        string id PK
        string workspaceId FK
        string clientId FK
        string name
        string description
        enum ProjectStatus status
        datetime startDate
        datetime endDate
        string createdBy FK
        datetime deletedAt
    }

    TASK {
        string id PK
        string workspaceId FK
        string projectId FK
        string assigneeId FK
        string title
        string description
        enum TaskStatus status
        enum TaskPriority priority
        datetime dueDate
        string createdBy FK
        datetime deletedAt
    }

    AUDIT_LOG {
        string id PK
        string actorId FK
        enum AuditAction action
        string targetType
        string targetId
        string workspaceId FK
        string requestId
        json metadata
        string chainHash
        datetime createdAt
    }
```

---

## 7. Dashboard Role Layouts

### Customer Workspace Dashboards (`apps/web`)

```mermaid
graph TB
    subgraph OWNER_DASH["OWNER Dashboard<br/>Design: Glassmorphism<br/>Layout: Bento Grid"]
        O1[Workspace Overview]
        O2[Project Stats]
        O3[Task Stats]
        O4[Recent Activity]
        O5[Team Members]
        O6[Quick Actions]
    end

    subgraph TADMIN_DASH["TEAM_ADMIN Dashboard<br/>Design: Minimalist<br/>Layout: Bento Grid"]
        T1[Workspace Overview]
        T2[Project Stats]
        T3[Task Stats]
        T4[Team Members]
        T5[Recent Activity]
    end

    subgraph MEMBER_DASH["MEMBER Dashboard<br/>Design: Productivity<br/>Layout: Kanban"]
        M1[My Tasks]
        M2[Assigned Projects]
        M3[Recent Activity]
        M4[Notifications]
    end

    subgraph VIEWER_DASH["VIEWER Dashboard<br/>Design: Editorial<br/>Layout: List"]
        V1[Workspace Overview]
        V2[Project Progress]
        V3[Task Status]
        V4[Recent Activity]
    end

    style OWNER_DASH fill:#003F5C,stroke:#333,color:#fff
    style TADMIN_DASH fill:#58508D,stroke:#333,color:#fff
    style MEMBER_DASH fill:#8A508F,stroke:#333,color:#fff
    style VIEWER_DASH fill:#64748B,stroke:#333,color:#fff
```

### Platform Staff Dashboards (`apps/platform-admin`)

```mermaid
graph TB
    subgraph SADMIN_DASH["SUPERADMIN Dashboard<br/>Design: Glassmorphism<br/>Layout: Bento Grid"]
        S1[Platform Overview]
        S2[Workspace Stats]
        S3[User Stats]
        S4[Staff Management]
        S5[Global Audit]
        S6[System Health]
    end

    subgraph PADMIN_DASH["PLATFORM_ADMIN Dashboard<br/>Design: Minimalist<br/>Layout: Grid"]
        P1[Tenant Overview]
        P2[Workspace Management]
        P3[User Management]
        P4[Usage Metrics]
    end

    subgraph ANALYST_DASH["ANALYST Dashboard<br/>Design: Dark Mode<br/>Layout: Bento Grid"]
        A1[Platform Telemetry]
        A2[User Growth]
        A3[API Usage]
        A4[Quota Reports]
        A5[Performance Monitoring]
    end

    subgraph SUPPORT_DASH["SUPPORT_AGENT Dashboard<br/>Design: Helpdesk<br/>Layout: Kanban"]
        SU1[Ticket Overview]
        SU2[SLA Metrics]
        SU3[Active Sessions]
        SU4[Resolution Rate]
    end

    style SADMIN_DASH fill:#003F5C,stroke:#333,color:#fff
    style PADMIN_DASH fill:#58508D,stroke:#333,color:#fff
    style ANALYST_DASH fill:#8A508F,stroke:#333,color:#fff
    style SUPPORT_DASH fill:#FF6361,stroke:#333,color:#fff
```

---

## 8. Deployment Architecture

```mermaid
graph TD
    subgraph Internet["Public Internet"]
        CF[Cloudflare / Load Balancer<br/>TLS 1.3 Termination]
    end

    subgraph VPC["VPC / Private Network"]
        subgraph Public_Subnet["Public Subnet"]
            WAF[WAF / Edge Security]
        end

        subgraph App_Subnet["Application Subnet"]
            WEB[Web Dashboard<br/>Next.js<br/>Port 3000]
            API[API Server<br/>NestJS<br/>Port 3001]
            ADMIN[Platform Admin<br/>Next.js<br/>Port 3002]
            DJ[Django AI<br/>Port 8000]
        end

        subgraph Data_Subnet["Data Subnet (Private)"]
            NEON[(Neon PostgreSQL<br/>Primary + Read Replicas)]
            REDIS[(Redis<br/>Cache + BullMQ)]
            S3[(S3-Compatible<br/>Object Storage)]
        end

        subgraph Monitoring["Monitoring & Observability"]
            PROM[Prometheus<br/>Metrics]
            GRAFANA[Grafana<br/>Dashboards]
            SENTRY[Sentry<br/>Error Tracking]
            LOKI[Loki<br/>Log Aggregation]
        end
    end

    CF --> WAF
    WAF --> WEB
    WAF --> API
    WAF --> ADMIN

    WEB --> API
    ADMIN --> API
    API --> NEON
    API --> REDIS
    API --> S3
    API --> DJ

    WEB --> PROM
    API --> PROM
    ADMIN --> PROM
    DJ --> PROM

    PROM --> GRAFANA
    API --> SENTRY
    WEB --> SENTRY
    API --> LOKI

    style CF fill:#FF6361,stroke:#333,color:#fff
    style NEON fill:#003F5C,stroke:#333,stroke-width:2px,color:#fff
    style API fill:#58508D,stroke:#333,color:#fff
```

---

## 9. Docker Container Architecture

```mermaid
graph LR
    subgraph Docker_Host["Docker Host"]
        subgraph API_Container["trifusion-api"]
            API_NODE[NestJS Node Process]
        end

        subgraph WEB_Container["trifusion-web"]
            WEB_NODE[Next.js Node Process]
        end

        subgraph ADMIN_Container["trifusion-platform-admin"]
            ADMIN_NODE[Next.js Node Process]
        end

        subgraph DJANGO_Container["trifusion-django"]
            DJ_PROC[Django Python Process]
        end
    end

    API_Container -->|DATABASE_URL| NEON[(Neon PostgreSQL)]
    WEB_Container -->|API_INTERNAL_URL| API_Container
    ADMIN_Container -->|API_INTERNAL_URL| API_Container
    DJANGO_Container -->|AI_SERVICE_URL| DJ_PROC
    DJ_PROC -->|DATABASE_URL| NEON

    style API_Container fill:#003F5C,stroke:#333,color:#fff
    style WEB_Container fill:#58508D,stroke:#333,color:#fff
    style ADMIN_Container fill:#8A508F,stroke:#333,color:#fff
    style DJANGO_Container fill:#FF6361,stroke:#333,color:#fff
```

---

## 10. AI Service Request Flow

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend (Browser)
    participant API as NestJS API
    participant AI_SVC as AI Service Adapter
    participant DJ as Django AI Service
    participant PROVIDER as AI Provider<br/>(OpenAI / Anthropic)

    FE->>API: POST /api/v1/workspaces/:id/ai/assistant<br/>+ question
    API->>AI_SVC: Validate workspace membership + role
    API->>API: Check AI quota (daily requests/tokens)
    API->>AI_SVC: Build signed service token<br/>HMAC-SHA256, 180s TTL
    AI_SVC->>DJ: POST /v1/ai/assistant<br/>+ signed token + context
    DJ->>PROVIDER: Chat completion request
    PROVIDER-->>DJ: Streamed response (SSE)
    DJ-->>AI_SVC: AI response + citations
    AI_SVC-->>API: Return result
    API->>API: Log AI_USAGE audit event
    API-->>FE: Streamed SSE response
```

---

## Diagram Legend

| Color | Meaning |
|-------|---------|
| `#003F5C` | API / Core Backend |
| `#58508D` | Secondary services, Platform Admin |
| `#8A508F` | AI, Analytics, MEMBER role |
| `#FF6361` | Errors, auth, SUPPORT_AGENT, Django |
| `#64748B` | VIEWER role, neutral elements |
