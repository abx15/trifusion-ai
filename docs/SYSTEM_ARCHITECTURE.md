# TriFusion AI — System Architecture

> **Document Status:** Active / Baseline Architecture for TriFusion AI  
> **Last Updated:** 2026-10-15  
> **Architecture Pattern:** Modular Monolith with Next.js App Router Web & NestJS API

---

## 1. Architecture Overview

TriFusion AI is an AI-powered Business Workspace designed for individuals, freelancers, digital agencies, and IT service companies. The system employs a **modular monolith** backend architecture paired with modern frontend web applications, ensuring tenant isolation, privacy by default, maintainability, and horizontal scalability.

### High-Level Topology

```text
                           +------------------------+
                           |  Browser / Client Apps |
                           +-----------+------------+
                                       |
                   HTTPS / WSS         |
           +---------------------------+---------------------------+
           |                                                       |
           v                                                       v
+-----------------------+                               +-----------------------+
|  apps/web (Next.js)   |                               | apps/platform-admin (Next.js) |
|  Customer Workspace   |                               | Platform Admin UI     |
+-----------+-----------+                               +-----------+-----------+
            |                                                       |
            | REST / SSE / WebSockets                               | REST
            +---------------------------+---------------------------+
                                        |
                                        v
                            +-----------------------+
                            |   apps/api (NestJS)   |
                            |   Core REST API &     |
                            |   Business Engine     |
                            +-----------+-----------+
                                        |
           +----------------------------+---------------------------+
           |                            |                           |
           v                            v                           v
+--------------------+        +--------------------+      +--------------------+
|     PostgreSQL     |        |   Redis & BullMQ   |      | S3-Compatible      |
|  Relational Data,  |        | Caching, Queues,   |      | Object Storage     |
|  Tenant Scoping,   |        | Rate Limiting,     |      | Private Files &    |
|  pgvector          |        | Session State      |      | Signed URLs        |
+--------------------+        +--------------------+      +--------------------+
                                        |
                                        v (Internal HTTP / gRPC)
                              +--------------------+
                              | services/ai-service|
                              | (Optional Python/  |
                              | FastAPI RAG Engine)|
                              +--------------------+
```

---

## 2. Monorepo Organization

The project is structured as a pnpm + Turborepo monorepo:

- **`apps/web`**: Next.js 14+ (App Router) customer-facing web application.
- **`apps/api`**: NestJS 10+ core REST API providing authentication, tenant isolation, client/project/task workflows, and AI orchestration.
- **`apps/admin`**: Next.js 14+ internal platform administration interface (strictly separated from tenant workspace admin).
- **`services/ai-service`**: Dedicated Python / FastAPI service for advanced RAG, document parsing, and heavy embedding generation (deferred until specialised AI workloads require it).
- **`packages/contracts`**: Shared API contracts, TypeScript interfaces, and Zod validation schemas.
- **`packages/ui`**: Shared design system components built on Tailwind CSS and Radix UI primitives.
- **`packages/utils`**: Domain-neutral utilities (formatting, date helpers, sanitization).
- **`packages/config`**: Shared configuration for ESLint, TypeScript, and tooling.
- **`database/prisma`**: Authoritative Prisma schema, migrations, and database client configuration.

---

## 3. Technology Stack Decisions

| Layer | Technology | Rationale |
|---|---|---|
| **Web Framework** | Next.js 14+ (App Router) + React + TypeScript | Server Components, fast streaming SSR, optimal SEO and developer experience |
| **Styling & UI** | Tailwind CSS + shadcn/ui (Radix primitives) | Accessible, unstyled primitives with utility-first responsive styling |
| **Frontend State** | TanStack Query (React Query) | Declarative caching, background refetching, and mutation states |
| **Backend Framework**| NestJS + TypeScript | Enterprise modular architecture, dependency injection, first-class OpenAPI |
| **Database & ORM** | PostgreSQL 16 + Prisma ORM | Relational consistency, strong typing, declarative migrations, ACID transactions |
| **Cache & Queues** | Redis + BullMQ | Fast key-value store, distributed locks, rate limiting, and reliable asynchronous job queues |
| **Object Storage** | S3-Compatible (MinIO / AWS S3 / Cloudflare R2) | Private bucket storage with pre-signed upload/download URLs |
| **AI Integration** | Direct NestJS Provider Adapter (OpenAI / Anthropic / Google) | Low-overhead streaming responses via SSE; Python FastAPI deferred until needed |

---

## 4. Tenancy & Authorization Model

TriFusion AI uses a **hybrid multi-tenant logical isolation** model within a single PostgreSQL database:

1. **Workspace Boundary**: Every tenant-owned record belongs directly or indirectly to a `Workspace` (`workspaceId`).
2. **Personal vs Company Workspaces**: Every user is automatically provisioned a personal workspace upon registration. Users can create or be invited to company workspaces.
3. **Customer Roles**:
   - `OWNER`: Full administrative control, billing, members, deletion.
   - `TEAM_ADMIN`: Member management, project assignment, settings.
   - `MEMBER`: Create, read, and edit assigned projects and tasks.
   - `VIEWER`: Read-only access to explicitly assigned workspace resources.
4. **Platform Roles**:
   - `SUPERADMIN`, `PLATFORM_ADMIN`, `ANALYST`: Internal platform staff roles managed separately in platform tables; platform staff never receive default access to customer workspace data.

For Phase 3, `MEMBER` can create and update workspace clients, projects, and tasks; `TEAM_ADMIN` and `OWNER` additionally archive/restore records and update settings; `VIEWER` is read-only. Resource access is workspace-wide until project-level ACLs are modeled.

---

## 5. Security & Isolation Architecture

- **Defense-in-Depth**:
  1. **Transport Layer**: Enforced TLS 1.3 in production.
  2. **API Layer**: Global `ValidationPipe` with strict DTO whitelisting and sanitization.
  3. **Guard Layer**: JWT verification, workspace membership validation, and RBAC policy evaluation.
  4. **Service Layer**: Explicit `workspaceId` predicate injected into every Prisma query.
  5. **Data Layer**: Relational foreign key constraints with indexed `workspaceId` columns; optional RLS policies for defense-in-depth.
- **Token Strategy**:
  - Short-lived Access Tokens (JWT, 15 minutes).
  - Long-lived Refresh Tokens (secure HTTP-only cookie or hashed DB session, 7 days with rotation).
  - One-time verification & password reset tokens (hashed SHA-256 with 1-hour expiry).

---

## 6. Observability & Health

- **Health Checks**: `/api/v1/health` providing readiness and liveness probes (checking Database and Redis connectivity).
- **Structured Logging**: JSON-formatted logs with request correlation IDs (`x-request-id`).
- **Error Tracking**: Centralized NestJS `HttpExceptionFilter` catching all errors and piping unhandled exceptions to Sentry while returning safe, sanitized error payloads to clients.
- **Dashboard API**: REST and read-only GraphQL are adapters over the same NestJS domain services and workspace policies. GraphQL has bounded pagination, depth/complexity, resolver timeout, and production introspection restrictions.

### Browser rendering and session boundary

- `apps/web` and `apps/platform-admin` are rendering clients; NestJS remains authoritative for business rules and workspace/platform authorization.
- Browser requests use a same-origin Next.js `/api/backend/*` proxy. The proxy holds app-specific bearer and refresh tokens in HttpOnly, Secure-in-production, SameSite=Strict cookies, injects Authorization only in server-to-server requests, and strips authentication tokens from browser responses. The platform console uses a distinct cookie namespace.
- `API_INTERNAL_URL` is a server-only URL. `NEXT_PUBLIC_API_URL` must not contain credentials or other secrets.
- Dashboard reads use one bounded GraphQL overview query plus cursor-paginated REST for workspace lists and mutations. TanStack Query keys include the authenticated user and workspace; authenticated requests use `no-store`, and auth changes clear client query state. No authenticated data is shared via a public Next.js cache.
- Recharts is loaded on demand. Loading, empty, and error states are rendered from actual API outcomes; unavailable platform aggregate/configuration APIs are shown as deferred, not replaced with sample values.
