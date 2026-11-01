# TriFusion AI - Architecture Overview

## Monorepo Structure

```
trifusion-ai/
├── apps/
│   ├── api/              # NestJS 10 REST + GraphQL API (port 3001)
│   ├── web/              # Next.js 16 Customer Web App (port 3000)
│   └── platform-admin/   # Next.js 16 Platform Admin App (port 3002)
├── packages/
│   ├── ui/               # Material UI Design System
│   ├── contracts/        # Shared API contracts and types
│   ├── config/           # Shared configuration
│   └── utils/            # Shared utilities
├── database/
│   └── prisma/           # Prisma schema and migrations
├── services/
│   └── ai-django/        # AI service (Django, needs lint fixes)
└── docs/                 # Documentation
```

## Authorization Layers (Strictly Separated)

### Customer Workspace Layer
Roles: OWNER, TEAM_ADMIN, MEMBER, VIEWER  
Scope: Per-workspace (tenant)  
Enforcement: `PolicyService` + `RequireWorkspaceRole` decorator

### Platform Staff Layer
Roles: SUPERADMIN, PLATFORM_ADMIN, ANALYST, SUPPORT_AGENT  
Scope: Global platform  
Enforcement: `PolicyService` + `RequirePlatformRole` decorator

**No mixing of the two namespaces.**

## Data Flow

```
Browser → Next.js App Router → API Proxy (/api/backend/*)
                                      ↓
                              NestJS Controller → Service → Prisma Client
                                      ↓
                              Neon PostgreSQL (neondb)
```

## Authentication

- JWT access token (15 min) + refresh token (7 days)
- HttpOnly, Secure, SameSite=strict cookies
- Token refresh on 401 with automatic retry
- Correlation ID propagation via `X-Request-Id`

## Database

- Neon PostgreSQL with connection pooling
- Prisma ORM with 22 models
- Workspace-scoped queries with composite indexes
- Audit log with hash-chained integrity

## Local Development Services

The root `pnpm dev` command uses Turbo to start all workspace packages with a `dev` script:

- Customer web: `3000`
- NestJS API: `3001`
- Platform admin: `3002`
- Django AI service: `3003`

The API package now exposes a `dev` script that delegates to its existing `start:dev` command. Django remains an internal AI boundary and receives signed service tokens from NestJS; browser business requests must not bypass NestJS policy enforcement.
