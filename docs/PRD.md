from pathlib import Path

content = r"""# TriFusion AI — Complete Project Blueprint

> **Document purpose:** This file is the central source of truth for the product vision, architecture, technology stack, repository structure, security rules, phased implementation plan, and launch checklist for TriFusion AI.
>
> **Repository name:** `trifusion-ai`
>
> **Status:** Planning / implementation blueprint. Technology choices are recommendations to guide implementation; they are not claims that every service or module has already been built.

---

## 1. Product vision

TriFusion AI is an **AI-powered Business Workspace** for individuals, freelancers, digital agencies, and IT/service companies. It should bring project work, client information, tasks, documents, team collaboration, reports, and AI assistance into one secure product.

The product should solve real operational problems rather than become a collection of disconnected features. Start with a narrow, reliable MVP, validate it with real users, and expand after the core workflow is stable.

### Initial target audience

Start with **small digital agencies and IT service companies**, while supporting an individual/personal workspace from the beginning. This gives the product a clear first use case without blocking future audiences.

### Core value proposition

- Keep clients, projects, tasks, and work updates in one place.
- Give each user and company a private, permission-controlled workspace.
- Use AI to summarise work, draft updates, and answer questions from authorised workspace data.
- Make progress and workload visible through useful reports.
- Expand through integrations and automation only after core workflows work reliably.

### Product principles

1. **Privacy by default:** a customer must never see another customer's data.
2. **Real data only:** production dashboards must use persisted data and real API responses, not hard-coded demo numbers.
3. **One source of truth:** avoid duplicate identity systems, duplicate business backends, and conflicting copies of records.
4. **Modular monolith first:** keep the core backend together until scale or team ownership provides a real reason to split it.
5. **AI with boundaries:** AI may assist and propose; sensitive or irreversible actions require explicit permission and, where appropriate, user confirmation.
6. **Build in phases:** finish and test each phase before adding more complexity.

---

## 2. Product scope and modules

### MVP modules

1. **Authentication and onboarding**
   - Sign up, sign in, sign out, email verification, password reset.
   - Create a personal workspace automatically.
   - Create or join a company workspace.
   - Invite members and accept invitations.
   - Profile and account settings.

2. **Workspaces and organisations**
   - Personal and company workspaces.
   - Workspace switcher.
   - Company details, membership, roles, and invitations.
   - Tenant-scoped data access.

3. **Clients**
   - Create, view, update, archive clients.
   - Client contact details and notes.
   - Link clients to projects.
   - Prevent users from accessing clients outside their workspace.

4. **Projects**
   - Project name, description, status, dates, client, owner, and members.
   - Project overview and activity history.
   - Project-specific access rules.

5. **Tasks**
   - Create, assign, prioritise, and update tasks.
   - Status, due date, assignee, project, and comments.
   - Filters and search.
   - Activity history and notifications.

6. **Dashboard and reports**
   - Counts and summaries derived from database queries.
   - Tasks due, overdue tasks, project status, recent activity.
   - Date range and workspace filters.
   - Empty, loading, error, and permission-denied states.

7. **AI assistant — limited MVP**
   - Summarise a project or a selected period.
   - Draft a weekly progress report.
   - Answer questions using only records the current user is allowed to access.
   - Display sources or linked records for data-grounded answers.
   - Apply usage limits and log AI usage.

### Later modules — only after the MVP is stable

- Documents and private file storage.
- Comments, notifications, and live activity.
- Time tracking and workload planning.
- Custom fields and configurable workflows.
- CRM pipeline and sales opportunities.
- Proposals, invoices, subscriptions, and payment integrations.
- Helpdesk/support tickets.
- Automation rules and scheduled reports.
- Advanced RAG, multi-step agents, and external integrations.
- Mobile application, public API, and marketplace integrations.

Do not build all later modules before users validate the MVP.

---

## 3. User roles and permission model

There are **two separate authorization layers**. Never mix them.

### A. Customer workspace roles

| Role | Intended permissions |
|---|---|
| `OWNER` | Manage workspace, billing, members, settings, and all workspace resources |
| `TEAM_ADMIN` | Manage members and workspace resources within assigned policy; cannot automatically access platform-wide controls |
| `MEMBER` | Create and work on resources allowed by workspace/project policy |
| `VIEWER` | Read-only access to explicitly permitted resources |

A user may belong to multiple workspaces and have a different role in each one. A personal workspace is also modelled as a workspace/tenant; it should not be a special bypass around tenant isolation.

### B. TriFusion platform staff roles

| Role | Intended permissions |
|---|---|
| `SUPERADMIN` | Platform configuration and tightly controlled privileged operations |
| `PLATFORM_ADMIN` | Operational administration within explicitly granted permissions |
| `ANALYST` | Access to approved, preferably aggregated or redacted analytics |

A platform employee does **not** automatically receive unrestricted access to customer content. Support access must be purpose-limited, authorised, time-bounded where possible, and audited.

### Authorization rules

- The frontend is not an authority for `userId`, `workspaceId`, role, ownership, or permissions.
- Resolve the authenticated user on the server.
- Verify workspace membership and resource-level access for every protected request.
- Use policy checks in the service layer and tenant-scoped database queries.
- Use PostgreSQL Row-Level Security (RLS) as defence-in-depth where it can be implemented and tested correctly.
- Test cross-tenant access attempts explicitly.

---

## 4. Recommended technology stack

Choose tools because they solve a specific problem. Do not deploy every technology listed here on day one.

### Frontend

| Area | Choice | Purpose |
|---|---|---|
| Framework | Next.js + React + TypeScript | Web application and routing |
| Routing | Next.js App Router | Pages, layouts, server/client boundaries |
| Styling | Tailwind CSS | Consistent responsive styling |
| UI components | shadcn/ui | Accessible, reusable interface primitives |
| API state | TanStack Query | Fetching, caching, mutations, invalidation |
| Forms | React Hook Form + Zod | Form state and schema validation |
| Charts | Recharts | Reports and dashboard charts |
| Workflow canvas | React Flow, later if needed | Visual workflow builder, not required for MVP |

Use a consistent design system, responsive layouts, accessible keyboard navigation, and explicit loading/error/empty states. Avoid hard-coded dashboard metrics.

### Core backend

| Area | Choice | Purpose |
|---|---|---|
| Runtime/language | Node.js + TypeScript | Main application runtime |
| Framework | NestJS | Modular API and business logic |
| API | REST first | Predictable, documented endpoints |
| API documentation | Swagger / OpenAPI | Contract documentation and testing |
| ORM | Prisma | Database access and migrations |
| Validation | DTO validation and shared schemas where appropriate | Validate untrusted input |
| Real-time | Socket.IO/WebSockets when needed | Bidirectional live updates |
| AI streaming | Server-Sent Events (SSE) | Stream AI responses |
| Background jobs | BullMQ + Redis | Queues, retries, scheduled work |

The main business backend is **NestJS + TypeScript**. Keep authentication, workspaces, clients, projects, tasks, permissions, billing state, and normal business rules in this backend.

### Database and storage

| Area | Choice | Purpose |
|---|---|---|
| Primary database | PostgreSQL | Relational business data and transactions |
| Data access | Prisma migrations | Versioned schema changes |
| Flexible fields | PostgreSQL JSONB, selectively | Custom metadata without uncontrolled schema sprawl |
| Vector search | pgvector, when semantic search is needed | Store/search embeddings near authorised records |
| Cache/queue | Redis | Cache, locks, queue infrastructure; never the only durable store for business records |
| File storage | Private S3-compatible object storage | Documents and attachments |
| File access | Short-lived signed URLs | Controlled download/upload access |

Start with one primary PostgreSQL database. Do not add MongoDB or a separate vector database without a demonstrated need.

### AI service

- Start by integrating **one LLM provider** through a provider adapter.
- Use structured outputs and tool/function calling where appropriate.
- Add embeddings and retrieval-augmented generation (RAG) when the product needs semantic search across documents or records.
- Use `pgvector` initially if its performance and operational needs are sufficient.
- Keep AI provider secrets on the server; never expose them in browser bundles.
- Apply workspace/user quotas, token/cost tracking, timeouts, retries, and audit logs.
- Enforce authorization **before** retrieving records for an AI prompt.
- Treat retrieved documents and user-provided content as untrusted input; defend against prompt injection.
- Require user confirmation for consequential actions such as sending messages, changing permissions, deleting records, or making payments.

**Optional Python services:**
- **FastAPI + Pydantic:** add only when specialised AI/RAG, document processing, or Python libraries justify a separate service.
- **Django + Django REST Framework:** add only for a clearly bounded Python domain or a genuine need for Django Admin. Do not create a second full backend that duplicates NestJS business logic.
- **Celery + Redis:** only for jobs owned by the Python service, if needed. The Node queue and Python queue must have clear ownership and responsibilities.

### Authentication

Choose **one identity source of truth**:

- Option A: a managed identity provider, such as Supabase Auth, if its current features, policies, pricing, and requirements fit.
- Option B: a carefully designed NestJS authentication module.

Do not implement two independent user identity systems. Other services must verify trusted tokens or use authenticated service-to-service communication. Store secrets in environment/secret management, not source control.

### Billing and payments

- For an India-first launch, evaluate Razorpay subscriptions and payment flows.
- Evaluate Stripe if it supports the intended business, country, and payout requirements.
- Verify payment webhooks server-side, make webhook handling idempotent, and never trust a frontend payment-success screen alone.
- Keep billing entitlements and usage limits enforced on the backend.

### Testing and quality

| Area | Tools / approach |
|---|---|
| Unit tests | Jest for NestJS |
| API integration tests | Supertest |
| End-to-end tests | Playwright |
| Python tests, if Python is deployed | Pytest |
| API contracts | OpenAPI and contract checks |
| Security | Authentication, RBAC, tenant isolation, abuse and input-validation tests |
| Code quality | ESLint, Prettier, TypeScript strict mode |
| CI | GitHub Actions |

### Deployment and observability

- Git + GitHub for source control and pull requests.
- pnpm + Turborepo for the monorepo, if the repository contains multiple JavaScript/TypeScript apps.
- Deploy Next.js to a suitable frontend host.
- Deploy NestJS to a persistent Node.js host.
- Deploy PostgreSQL and Redis as managed services where practical.
- Deploy a Python service only if the product actually requires one.
- Use GitHub Actions for linting, type-checking, tests, and builds.
- Use Sentry or an equivalent error tracker, structured logs, health checks, and backups.
- Add OpenTelemetry when cross-service tracing is useful.
- Docker is optional for local consistency/deployment; it is not a reason to consume unnecessary disk space if the development setup does not need it.

**Do not start with Kubernetes, microservices for every module, Temporal, multiple LLM providers, or a separate vector database.** Add them only when measurable requirements justify the cost and operational complexity.

---

## 5. Repository name and folder structure

Recommended repository/root folder: **`trifusion-ai`**.

```text
trifusion-ai/
├── apps/
│   ├── web/                       # Customer-facing Next.js app
│   ├── api/                       # Main NestJS API
│   └── admin/                     # TriFusion internal platform admin UI
├── services/
│   └── ai-service/                # Optional FastAPI AI/RAG service; add when needed
├── packages/
│   ├── ui/                        # Shared UI components, if genuinely shared
│   ├── contracts/                 # Shared API contracts/types
│   ├── config/                    # Shared TypeScript/ESLint configuration
│   └── utils/                     # Small, domain-neutral utilities
├── database/
│   ├── prisma/                    # Prisma schema and migrations
│   ├── seeds/                     # Development/test seed scripts
│   └── docs/                      # ER diagrams and data model notes
├── infrastructure/
│   ├── docker/                    # Optional Docker files
│   ├── deployment/                # Deployment configuration/docs
│   └── monitoring/                # Monitoring configuration
├── docs/
│   ├── PRD.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── API_CONTRACTS.md
│   ├── SECURITY.md
│   ├── DEVELOPMENT_ROADMAP.md
│   └── ADRs/                      # Architecture Decision Records
├── tests/
│   ├── e2e/
│   ├── integration/
│   └── security/
├── scripts/
├── .github/
│   └── workflows/
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── README.md
└── LICENSE
```

### Structure notes

- `apps/admin` is the **TriFusion platform's internal admin interface**. It is not the same thing as a customer's `TEAM_ADMIN` role.
- Do not create an empty Django service just because Django might be useful later. Add `services/django-service/` only when a real requirement exists.
- Keep Prisma schema/migrations in one clearly owned location and ensure build/deployment scripts use that location consistently.
- Keep secrets out of `.env.example`; use placeholder names and example values only.
- A shared package should exist because more than one app uses it, not merely to make the tree look bigger.
- If the monorepo becomes cumbersome at the MVP stage, simplify rather than creating artificial abstractions.

### Suggested initial root scripts

Exact commands depend on the generated workspace setup, but the root should eventually provide consistent commands such as:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

Document any app-specific commands in the README. Keep package manager versions and Node.js version consistent across developer machines and CI.

---

## 6. High-level architecture

```text
Browser
  |
  v
Next.js Web App -------------------- Next.js Admin UI
  |                                      |
  | HTTPS / REST                         | HTTPS / REST
  v                                      v
                 NestJS API
                    |
          +---------+-----------+
          |         |           |
          v         v           v
      PostgreSQL   Redis    Private Object Storage
      + Prisma   + BullMQ   + signed URLs
          |
          v
     pgvector (when needed)

NestJS API ---- authenticated internal calls ----> Optional FastAPI AI Service
```

### Request flow

1. The user signs in through the chosen identity system.
2. The browser sends a trusted session/token with the request.
3. NestJS validates the session/token and resolves the user identity.
4. The API checks workspace membership and resource-level permissions.
5. The service executes tenant-scoped database operations.
6. The API returns a validated response; the frontend updates its cache/UI.
7. Long-running work is placed on a queue when appropriate.
8. Real-time updates are published only to authorised workspace/project recipients.
9. AI requests retrieve only authorised context, apply quotas, call the model, validate output, and log usage.

### API style

- REST for standard create/read/update/archive operations.
- SSE for streamed AI responses.
- WebSockets for live notifications/activity where bidirectional or low-latency updates justify them.
- Webhooks for payment and third-party events.
- GraphQL only if real client use cases justify its additional complexity.
- gRPC is not required for the initial product.

---

## 7. Initial domain model

This is a starting point, not a final migration-ready schema. Validate exact fields and relationships before implementation.

### Identity and tenancy

- `User`
- `UserProfile`
- `Workspace`
- `WorkspaceMember`
- `WorkspaceInvitation`
- `Session` or identity-provider linkage, depending on the auth design
- `PlatformRoleAssignment` (separate from workspace roles)

### Business data

- `Client`
- `Project`
- `ProjectMember`
- `Task`
- `TaskComment`
- `ActivityEvent`
- `Notification`
- `AiUsageRecord`
- `AuditLog`

### Later domain tables

- `Document`, `DocumentVersion`, `DocumentPermission`
- `TimeEntry`
- `Workflow`, `WorkflowRun`
- `Subscription`, `Entitlement`, `UsageCounter`
- `Integration`, `WebhookEndpoint`, `WebhookDelivery`
- `SupportTicket`, `TicketComment`, `TicketAssignment`

### Data design rules

- Every tenant-owned record must have a clear workspace/tenant ownership path.
- Prefer explicit foreign keys and constraints over loose text identifiers.
- Add indexes for common filters, joins, tenant IDs, statuses, assignees, and timestamps after examining query patterns.
- Use transactions for multi-record business operations.
- Use soft deletion only where recovery, audit, or retention needs justify it; define how deleted records behave.
- Store money in a precise representation, not floating-point arithmetic.
- Store timestamps consistently and render them in the user's intended timezone.
- Do not store sensitive secrets in general-purpose JSON fields.
- Add database migrations and test rollback/recovery procedures as appropriate.

---

## 8. API design outline

Use a versioned route convention such as `/api/v1/...` unless the deployment/API gateway dictates otherwise.

### Example resource groups

```text
/api/v1/auth/*
/api/v1/me
/api/v1/workspaces
/api/v1/workspaces/:workspaceId/members
/api/v1/workspaces/:workspaceId/invitations
/api/v1/workspaces/:workspaceId/clients
/api/v1/workspaces/:workspaceId/projects
/api/v1/workspaces/:workspaceId/tasks
/api/v1/workspaces/:workspaceId/activity
/api/v1/workspaces/:workspaceId/reports
/api/v1/workspaces/:workspaceId/ai/*
/api/v1/platform-admin/*
```

These are examples for planning, not a requirement to implement every route immediately.

### API conventions

- Use DTOs and validate all incoming payloads.
- Return consistent error structures and appropriate HTTP status codes.
- Add pagination, sorting, and filters for collection endpoints.
- Do not return database internals, secrets, or fields the caller is not allowed to see.
- Enforce tenant membership and resource permissions server-side.
- Use idempotency keys for operations that may be retried and could otherwise duplicate effects.
- Keep Swagger/OpenAPI documentation in sync with actual behaviour.
- Do not make the frontend call a private database directly for privileged business operations.

---

## 9. Security, privacy, and reliability

### Authentication and access

- Verify tokens/sessions on the server.
- Use secure, HttpOnly, appropriately configured cookies when cookie-based sessions are used.
- Apply MFA to privileged accounts when supported.
- Use short-lived, scoped credentials for service-to-service communication.
- Separate platform staff permissions from customer workspace permissions.
- Audit privileged actions and sensitive support access.

### Tenant isolation

- Scope all workspace-owned reads and writes by the authenticated user's membership.
- Never accept a frontend-provided workspace ID as proof of membership.
- Prevent IDOR/BOLA issues by checking access to each referenced resource.
- Consider PostgreSQL RLS as a second line of defence; test pooled-connection/session-context handling carefully.
- Test that User A in Workspace A cannot read, change, export, or infer data belonging to Workspace B.
- Do not expose raw database errors or cross-tenant existence information.

### Web and API security

- Configure CORS to known application origins.
- Protect cookie-authenticated state-changing requests against CSRF.
- Rate-limit login, password reset, invitations, expensive searches, AI endpoints, and public webhooks.
- Validate and size-limit request bodies and uploads.
- Use safe output rendering and prevent injection vulnerabilities.
- Verify payment/webhook signatures and process events idempotently.
- Keep dependencies updated and secrets out of Git history.
- Use least-privilege database credentials and private object-storage buckets.
- Back up the database and periodically test restore procedures.

### AI-specific safety

- Check user permissions before building retrieval context.
- Treat documents, websites, tool results, and user content as untrusted instructions.
- Use allowlisted tools and validate every tool argument and result.
- Prevent AI from granting permissions or bypassing backend policy.
- Add per-user/workspace quotas, token limits, timeouts, and cost monitoring.
- Require confirmation before high-impact or irreversible actions.
- Keep an audit trail without logging unnecessary private content or secrets.

### Reliability

- Provide health/readiness checks.
- Set timeouts and bounded retries; do not retry every failure forever.
- Use dead-letter handling or an equivalent recovery path for repeatedly failing jobs.
- Make background jobs idempotent where possible.
- Monitor error rates, latency, queue depth, database health, AI spend, and backup status.
- Provide useful error states rather than silently failing.

---

## 10. Implementation roadmap — 9 phases

The project is divided into **9 phases (Phase 0 to Phase 8)**. These are delivery gates, not fixed calendar promises. Each phase is complete only when its acceptance criteria pass.

### Phase 0 — Product definition and setup

**Build**
- Confirm MVP audience and core use cases.
- Write user stories and acceptance criteria.
- Decide auth provider, hosting, database, and initial AI provider.
- Create `trifusion-ai` repository, workspace tooling, linting, formatting, environment templates, and CI skeleton.
- Write architecture decisions and basic threat model.

**Deliverables**
- `README.md`, `docs/PRD.md`, `docs/SYSTEM_ARCHITECTURE.md`, `docs/SECURITY.md`.
- Initial repository, CI checks, `.env.example`.

**Done when**
- The team can install dependencies, run the project, lint/type-check, and build it from documented instructions.
- MVP scope and non-goals are written down.

### Phase 1 — Foundation and identity

**Build**
- Next.js app shell, responsive navigation, design tokens, and shared UI primitives.
- NestJS app structure, config validation, health endpoint, Swagger, logging, and exception handling.
- PostgreSQL + Prisma setup and first migrations.
- Sign-up/sign-in/sign-out, email verification, password reset, and user profile.
- Secure session/token validation and initial CI tests.

**Deliverables**
- Working web/API connection.
- Authentication flow with useful error/loading states.
- First schema migration and automated tests.

**Done when**
- Users can register/sign in/out reliably.
- Protected API routes reject unauthenticated requests.
- Secrets are not committed, and CI passes.

### Phase 2 — Workspaces, membership, and tenant isolation

**Build**
- Create a personal workspace on onboarding.
- Create company workspaces.
- Invite users and accept/revoke invitations.
- Implement `OWNER`, `TEAM_ADMIN`, `MEMBER`, and `VIEWER`.
- Build workspace switcher and membership settings.
- Apply tenant-scoped query patterns and access policies.

**Deliverables**
- Workspace onboarding and member management.
- Documented permission matrix.
- Cross-tenant security tests.

**Done when**
- One user can belong to multiple workspaces with different roles.
- Users cannot read or mutate another workspace's data by changing IDs or requests.
- Platform roles are separate from customer roles.

### Phase 3 — Core business workflow

**Build**
- Client CRUD/archive.
- Project CRUD/status/membership.
- Task CRUD, assignment, priority, due dates, and status.
- Comments or activity history for core records.
- Search, pagination, filtering, and server-derived dashboard counts.
- Responsive client, project, and task views.

**Deliverables**
- End-to-end flow: create client → create project → add tasks → assign tasks → update status.
- API documentation and unit/integration tests.

**Done when**
- The full workflow persists to PostgreSQL and survives reloads.
- Dashboard data comes from the API/database, not hard-coded metrics.
- Permissions are enforced at both API and UI layers; the API remains authoritative.

### Phase 4 — Collaboration and notifications

**Build**
- In-app notifications and notification preferences.
- Activity feed and clear actor/action/time information.
- Email notifications for selected events, with delivery tracking where appropriate.
- WebSockets only for the live events that need them.
- Background jobs, retries, and failure handling.

**Deliverables**
- Reliable task assignment/status notifications.
- Queue/notification tests and operational logs.

**Done when**
- Events are delivered to authorised recipients only.
- Duplicate/retried jobs do not create uncontrolled duplicate effects.
- The product remains usable if a real-time connection drops.

### Phase 5 — AI assistant MVP

**Build**
- A provider abstraction for one LLM provider.
- AI request endpoint and streaming via SSE if appropriate.
- Project summaries and weekly progress-report drafts.
- Retrieval from authorised workspace records; add embeddings/pgvector only when needed.
- Structured output validation, prompt-injection mitigations, quotas, usage tracking, and cost reporting.
- Clear UI showing what the AI used and where users can inspect source records.

**Deliverables**
- AI assistant for a small set of well-defined use cases.
- AI safety tests and usage/cost dashboard for platform operators.

**Done when**
- AI cannot retrieve records outside the current user's permissions.
- Invalid model output is handled safely.
- Quotas, timeouts, provider failures, and unavailable AI are handled gracefully.
- Users can distinguish generated suggestions from saved/approved actions.

### Phase 6 — Files, reporting, and subscriptions

**Build**
- Private file uploads/downloads through signed URLs.
- File size/type limits, permission checks, and metadata records.
- Useful reports with date filters and export permissions.
- Subscription and entitlement model.
- Payment-provider integration only after pricing and business requirements are validated.
- Signed, idempotent webhook processing and billing audit trail.

**Deliverables**
- Private document handling.
- Verified reports and billing/usage enforcement.

**Done when**
- Private files cannot be fetched without valid authorised access.
- Payment status is verified server-side.
- Usage limits are enforced by the backend and billing events are idempotent.

### Phase 7 — Hardening, testing, and beta

**Build**
- End-to-end coverage for key user journeys.
- Tenant-isolation, RBAC, rate-limit, validation, and upload security tests.
- Performance testing for important database queries and APIs.
- Accessibility and responsive-device checks.
- Error monitoring, alerts, database backup/restore drills, and incident notes.
- Privacy policy, terms, retention/deletion rules, and support process.

**Deliverables**
- Beta release candidate, known-issues list, operational runbook, and rollback plan.

**Done when**
- Critical user journeys pass on clean test data.
- No known critical/high-risk tenant-isolation issue remains open.
- Backups and restore steps have been tested.
- Production secrets, logs, alerts, and ownership are configured.

### Phase 8 — Launch and measured expansion

**Build**
- Deploy production environments and migrations safely.
- Set up onboarding, product analytics with privacy-conscious events, and support channels.
- Invite a small group of real pilot customers.
- Collect feedback and prioritise defects/usability issues.
- Monitor activation, weekly active usage, workflow completion, retention, error rates, latency, and AI cost.
- Add modules only when user evidence justifies them.

**Deliverables**
- Production MVP, launch checklist, feedback backlog, and a measurable improvement cycle.

**Done when**
- A real user can sign up, create/use a workspace, manage clients/projects/tasks, and use the AI feature within permissions.
- Monitoring and support are active.
- The team has a prioritised post-launch roadmap based on real usage.

---

## 11. Indicative timeline and milestones

Calendar estimates depend on team size, experience, integrations, and available hours. Treat this as a planning range, not a guarantee.

| Milestone | Indicative effort | Result |
|---|---:|---|
| Scope and repository foundation | 1–2 weeks | Requirements, repo, CI, architecture |
| Identity and workspaces | 2–4 weeks | Auth, membership, permissions |
| Clients/projects/tasks | 3–5 weeks | Useful core product |
| Notifications and AI MVP | 2–4 weeks | Collaboration and bounded AI features |
| Files, billing, and reports | 2–4 weeks | Optional commercial capabilities |
| Hardening and pilot launch | 2–4 weeks | Tested, monitored beta/production |

A solo developer working part-time may need substantially longer. Reduce scope before compromising tenant isolation, data integrity, or security.

---

## 12. Environment variables and configuration

Maintain `.env.example` with variable names and safe placeholders, for example:

```dotenv
NODE_ENV=development
PORT=3001
WEB_URL=http://localhost:3000
DATABASE_URL=
REDIS_URL=
AUTH_SECRET=
AUTH_ISSUER_URL=
AUTH_AUDIENCE=
AI_PROVIDER=
AI_API_KEY=
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=
PAYMENT_PROVIDER=
PAYMENT_WEBHOOK_SECRET=
SENTRY_DSN=
```

This is an illustrative list. Actual variable names depend on the selected providers and implementation. Never commit real secrets. Validate required configuration at application startup and fail clearly when critical values are missing.

---

## 13. Engineering workflow

1. Create an issue with the user problem, acceptance criteria, and security implications.
2. Decide the API contract and data model before building UI that depends on them.
3. Implement the migration and backend rules.
4. Add unit/integration tests, including permission checks.
5. Connect the frontend to the real API.
6. Add loading, empty, error, and retry states.
7. Run lint, type-check, tests, and production build.
8. Review logs, access policies, and migration safety.
9. Merge through a pull request and deploy to staging.
10. Verify the deployed flow before promoting to production.

### Definition of done

A feature is not complete just because its page looks correct. It must include:
- Persisted data and real API integration.
- Server-side authorization and input validation.
- Loading, empty, error, and success states.
- Tests for the main behaviour and denied access.
- Responsive/accessibility checks where relevant.
- Updated API/docs and migration notes.
- Logs/monitoring for important failures.

---

## 14. MVP acceptance checklist

### Product
- [ ] User can register, sign in, sign out, and recover an account.
- [ ] User gets a personal workspace.
- [ ] User can create a company workspace and invite teammates.
- [ ] Workspace switcher reflects actual memberships.
- [ ] Customer roles behave according to the permission matrix.
- [ ] Users can create clients, projects, and tasks.
- [ ] Tasks can be assigned and moved through statuses.
- [ ] Dashboard metrics come from real data.
- [ ] AI can draft a summary/report using only authorised context.

### Engineering
- [ ] Prisma migrations run in a clean environment.
- [ ] REST API is documented.
- [ ] Type-check, lint, unit, integration, and key E2E tests pass.
- [ ] Production build succeeds.
- [ ] Environment variables are validated.
- [ ] Logs do not leak secrets or unnecessary personal content.

### Security
- [ ] Cross-tenant access tests pass.
- [ ] Every protected endpoint checks permissions.
- [ ] Uploads are private and access-controlled, if files are enabled.
- [ ] Rate limits and request validation are enabled.
- [ ] Webhook signatures and idempotency are tested, if billing is enabled.
- [ ] AI quotas, retrieval permissions, and tool allowlists are enforced.
- [ ] Backup restoration and incident response are documented.

### Launch
- [ ] Domain, HTTPS, environment variables, and migrations are configured.
- [ ] Health checks and error monitoring are active.
- [ ] Privacy policy, terms, support process, and deletion/retention policy are ready.
- [ ] Pilot users can complete the main workflow.
- [ ] Feedback and incident triage have clear owners.

---

## 15. What not to build too early

Avoid these until there is a proven need:

- Multiple competing core backends for the same business domain.
- A separate Django service just because Python is available.
- Microservices for every module.
- Kubernetes or complex orchestration for an early MVP.
- A separate vector database before evaluating pgvector.
- Several LLM providers before one integration is reliable.
- A custom workflow engine before simple task/project workflows are validated.
- A large billing/ERP/CRM/helpdesk suite before the core product is useful.
- Real-time sockets for data that can be refreshed safely through normal API requests.
- Dashboard cards with invented demo values in production.

---

## 16. Final implementation order

Follow this order unless user testing or a concrete technical constraint gives a strong reason to change it:

1. Product requirements and repository setup.
2. Next.js app + NestJS API + PostgreSQL/Prisma foundation.
3. Identity and session validation.
4. Personal/company workspaces and tenant isolation.
5. Clients, projects, tasks, and real dashboard data.
6. Tests and API contracts.
7. Notifications and background jobs.
8. Bounded AI assistant with permission-aware retrieval.
9. Files, reporting, billing, and integrations as needed.
10. Security hardening, pilot users, monitoring, and launch.
11. Use feedback and metrics to decide the next module.

**The guiding rule:** build a small, secure, end-to-end product first. Add complexity only when real users or measured technical limits justify it.
"""
path = Path("/mnt/data/TriFusion_AI_Complete_Project_Blueprint.md")
path.write_text(content, encoding="utf-8")
print(f"Created: {path}\nSize: {path.stat().st_size:,} bytes")
