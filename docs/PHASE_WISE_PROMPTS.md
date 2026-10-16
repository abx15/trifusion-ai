from pathlib import Path

prompts = r"""# TriFusion AI — Phase-Wise Coding Agent Prompts

> **How to use:** Open the `trifusion-ai` repository in your coding agent (Cursor, Claude Code, Antigravity, or equivalent). Keep `PROJECT_BLUEPRINT.md` in the repository root. Paste only the prompt for the phase you are currently implementing. Do not start the next phase until the current phase's acceptance criteria pass.
>
> **Important:** These prompts instruct the agent to inspect the existing repository and work in-place. They do not assume that any feature already exists.

---

## Global rules — apply to every phase

The following rules apply to every prompt below. Keep them in your project instructions file (for example, `AGENTS.md`) if your coding agent supports repository instructions.

- Read `PROJECT_BLUEPRINT.md` first and follow it as the project's source of truth. If it does not exist, stop and ask for it rather than silently inventing a different architecture.
- Inspect the repository, current Git status, package manager, installed versions, existing code, tests, and environment examples before changing anything.
- Preserve working functionality. Do not replace files or architecture wholesale without a clear reason.
- Implement real, connected features—not static mockups, fake API responses, hard-coded dashboard numbers, or TODO-only implementations.
- Do not claim a feature works unless you ran the relevant checks and observed the result. Clearly report anything not run and why.
- Use the selected stack: Next.js App Router + React + TypeScript for web; NestJS + TypeScript for the core API; PostgreSQL + Prisma for persistence. Add FastAPI only for a justified specialised AI/Python workload. Do not add Django or duplicate core business logic unless a concrete requirement justifies it.
- Use the repository's existing package manager and supported versions. Do not blindly upgrade dependencies or introduce incompatible major versions.
- Never expose secrets, tokens, passwords, private keys, or production data in code, logs, screenshots, test fixtures, or documentation. Update `.env.example` with names and safe placeholders only.
- All tenant-owned data must be scoped to the authenticated user's authorised workspace. Never trust a frontend-supplied `userId`, role, or workspace ID as proof of access.
- Validate inputs on the server, return safe and consistent errors, and add tests for both allowed and denied access.
- Use migrations for schema changes. Never reset, drop, or wipe a real database to make tests pass. Use an isolated test database for destructive test operations.
- Make UI responsive and accessible. Include loading, empty, error, success, and permission-denied states where relevant.
- Keep code modular and understandable. Avoid unnecessary microservices, Kubernetes, multiple databases, multiple LLM providers, or empty placeholder folders.
- After implementation, run the relevant lint, type-check, tests, and build commands available in the repository. Fix regressions introduced by your changes.
- Update the relevant documentation and maintain a concise change log in your final response.
- Do not silently skip failures. Report exact commands, pass/fail results, unresolved issues, environment prerequisites, and the next recommended step.
- If a requirement is ambiguous or a destructive action is needed, stop and ask before proceeding. For ordinary implementation details, choose a sensible default and document it.

---

## Phase 0 — Product definition, repository audit, and foundation

**Prompt to paste:**

You are the lead engineer setting up TriFusion AI. Read `PROJECT_BLUEPRINT.md` completely and follow it as the source of truth.

First audit the current repository and report its actual state: folder structure, Git status, package manager, Node.js version if detectable, existing apps, scripts, dependencies, tests, configuration, and any implementation already present. Do not assume the repository is empty. Do not delete or overwrite working code.

Then implement Phase 0 only:

1. Confirm the MVP scope from the blueprint: personal and company workspaces, membership/roles, clients, projects, tasks, real dashboard data, and a bounded AI assistant.
2. Create or update a practical `README.md` with prerequisites, installation, environment setup, local development commands, test commands, build commands, and architecture overview.
3. Create or update `docs/PRD.md`, `docs/SYSTEM_ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/DEVELOPMENT_ROADMAP.md` using the blueprint. Clearly mark undecided provider choices as decisions still required; do not invent credentials or claim services are configured.
4. Set up or verify the repository's package manager and workspace tooling only if appropriate. Use pnpm + Turborepo only if this is actually a JavaScript/TypeScript monorepo; avoid unnecessary tooling if the current repo is simpler.
5. Add safe `.env.example`, `.gitignore`, consistent formatting/linting/type-check scripts, and a basic CI workflow if missing. Do not add real secrets.
6. Record major architecture choices as concise ADRs under `docs/ADRs/`.
7. Add a small, useful health/verification checklist to the README.
8. Do not build future product modules in this phase.

Acceptance criteria:
- Existing work is preserved and Git changes are understandable.
- A new developer can follow the README to install and run the available apps.
- Environment examples contain placeholders only.
- Relevant lint/type-check/build checks pass, or exact blockers are documented.
- `docs/PHASE_0_REPORT.md` lists findings, changes, commands run, results, decisions needed, and next phase readiness.

Stop after Phase 0. Do not start Phase 1.

---

## Phase 1 — Application foundation and identity

**Prompt to paste:**

Read `PROJECT_BLUEPRINT.md`, `docs/PRD.md`, `docs/SYSTEM_ARCHITECTURE.md`, the Phase 0 report, and the current code before editing. Implement Phase 1 only. Preserve existing working features and use the repository's existing supported dependency versions.

Goals:
1. Establish the Next.js App Router web shell and NestJS API foundation if they do not already exist.
2. Create a clean, responsive design system and shared UI primitives. Build the application shell, navigation, page layouts, and consistent loading/error/empty states. Do not build workspace/business features yet unless needed for authentication.
3. Configure NestJS configuration validation, safe structured logging, global error handling, request validation, a health endpoint, and Swagger/OpenAPI.
4. Configure PostgreSQL and Prisma using a version compatible with the repository. Add the initial schema/migration without destructive database operations. If database credentials are unavailable, create the integration and document the exact setup required; do not pretend migrations were applied.
5. Implement one identity source of truth. First inspect the blueprint and repository for an existing identity provider. If one is already chosen, integrate it. Otherwise, document the choice that must be made before implementing provider-specific authentication; do not build two competing identity systems.
6. Implement the chosen sign-up/sign-in/sign-out/session verification, email verification, password reset, and profile basics to the extent supported by the chosen provider and available configuration. Secure secrets and sessions. Never store plaintext passwords or trust client-supplied user IDs.
7. Connect the web app to the real API with a typed, maintainable API client. Avoid fake success responses.
8. Add tests for unauthenticated access, session/token validation, validation errors, and health endpoints.

Acceptance criteria:
- Web app and API start using documented commands.
- Health endpoint works and Swagger reflects real routes.
- Authentication is backed by the selected identity system, not a local mock.
- Protected API endpoints reject unauthenticated requests.
- Prisma schema and migrations are versioned and non-destructive.
- Relevant checks pass, or blockers are clearly documented.
- Write `docs/PHASE_1_REPORT.md` with implementation details, environment requirements, test results, and known gaps.

Stop after Phase 1. Do not implement workspace membership or clients/projects/tasks yet.

---

## Phase 2 — Workspaces, membership, roles, and tenant isolation

**Prompt to paste:**

Read the blueprint, previous phase reports, database schema, API contracts, and current code. Implement Phase 2 only.

Build a secure workspace/tenant model:
1. Every user gets a personal workspace through an idempotent onboarding flow.
2. A user can create or join company workspaces and belong to multiple workspaces with different roles.
3. Implement workspace switching in the UI based on the authenticated user's actual memberships.
4. Implement invitations with secure, expiring, single-use tokens; acceptance and revocation; safe handling of duplicate emails and expired/reused invitations.
5. Implement customer roles `OWNER`, `TEAM_ADMIN`, `MEMBER`, and `VIEWER` with a documented permission matrix. Keep platform roles `SUPERADMIN`, `PLATFORM_ADMIN`, and `ANALYST` separate from customer workspace roles. Do not grant platform staff automatic unrestricted customer-data access.
6. Enforce permissions in NestJS guards/policies/services and tenant-scoped queries. The UI may hide unavailable actions, but the API must be authoritative.
7. Add unique constraints, foreign keys, indexes, and migrations for the workspace/membership/invitation model.
8. Consider PostgreSQL RLS as defence-in-depth only if it can be implemented safely with the chosen connection pooling/session-context strategy. Do not claim RLS protects data unless tested.
9. Add audit events for membership/role/invitation changes where appropriate.
10. Build screens for workspace creation, switching, members, invitations, and role management.
11. Add negative tests: a user in Workspace A cannot read or modify Workspace B resources by changing an ID, forging a role, or submitting another user's identifier.

Acceptance criteria:
- Personal and company workspaces persist correctly.
- A user can have different roles in different workspaces.
- Invitation tokens expire and cannot be reused.
- Role changes and member removal take effect server-side.
- Cross-tenant access tests pass.
- No customer role can call platform-only endpoints.
- Write `docs/PHASE_2_REPORT.md` with schema changes, permissions, test results, and remaining risks.

Stop after Phase 2. Do not build clients/projects/tasks yet.

---

## Phase 3 — Clients, projects, tasks, and real dashboard data

**Prompt to paste:**

Read the blueprint, previous reports, database schema, API contracts, and current code. Implement Phase 3 only, using the existing workspace and authorization model.

Build a complete persisted workflow:

1. **Clients:** create, list, view, update, archive, search, and paginate clients within a workspace. Validate contact data and prevent cross-workspace access.
2. **Projects:** create, list, view, update, archive, set status and dates, link to a client, and manage project membership where permitted.
3. **Tasks:** create, list, view, update, archive/complete as appropriate, assign to permitted members, set priority/status/due date, link to a project, and add comments/activity where in MVP scope.
4. **Permissions:** enforce create/read/update/archive/assign permissions on the server. Check that the client, project, task, assignee, and workspace relationships are consistent; reject mismatched IDs.
5. **Database:** add Prisma models, constraints, indexes, and migrations. Use transactions for multi-record operations. Do not reset the database.
6. **API:** implement versioned REST endpoints, DTO validation, consistent errors, pagination, filters, and Swagger documentation.
7. **Frontend:** build responsive clients, projects, task lists/details, creation/edit forms, filters, status updates, and workspace-aware navigation.
8. **Dashboard:** calculate counts, overdue tasks, recent activity, and project summaries from real API/database data. Remove fake hard-coded production metrics. If there is no data, show a genuine empty state.
9. **UX:** include loading, empty, error, success, retry, and permission-denied states. Avoid buttons that appear functional but do nothing.
10. **Tests:** cover core CRUD, validation, workspace scoping, role restrictions, inconsistent foreign IDs, and key end-to-end flows.

Acceptance criteria:
- A user can create a client, create a project for that client, add tasks, assign tasks, and update statuses.
- Data persists across reloads and is fetched from the real API.
- Dashboard values derive from actual persisted data.
- Unauthorized users cannot read or mutate resources.
- Tests, lint, type-check, and build pass or exact blockers are documented.
- Write `docs/PHASE_3_REPORT.md`, including endpoints, models, test results, and remaining gaps.

Stop after Phase 3. Do not start notifications or AI.

---

## Phase 4 — Collaboration, activity, notifications, and background jobs

**Prompt to paste:**

Read the blueprint and previous reports. Audit the existing event, email, Redis, and real-time infrastructure before adding dependencies. Implement Phase 4 only.

1. Define a small, documented event model for important actions such as task assigned, task status changed, project membership changed, and invitation received.
2. Implement persisted in-app notifications with read/unread state, pagination, and per-user access control.
3. Add an activity feed for authorised workspace/project members. Store actor, action, resource reference, timestamp, and only the minimum safe metadata needed.
4. Add email notifications for a small set of valuable events only if an email provider is configured. If not configured, implement a clean provider interface and document setup; do not claim email was sent.
5. Use BullMQ + Redis for jobs that genuinely need retries, scheduling, or asynchronous processing. If Redis is not configured, do not pretend queues are running. Document local setup and safe failure behaviour.
6. Add WebSockets/Socket.IO only for live updates that justify them. Authenticate the connection and check workspace membership for every subscription/room. Never broadcast tenant events globally.
7. Handle retries, duplicate delivery, queue failure, reconnects, and stale clients. Use idempotent job/event handling where needed.
8. Add tests for notification ownership, cross-workspace event leakage, unauthorised socket subscriptions, retry behaviour, and duplicate processing.

Acceptance criteria:
- Relevant actions create durable notifications/activity.
- Only authorised recipients can view notification/activity data.
- Realtime disconnection does not break normal API workflows.
- Jobs have bounded retries and observable failure handling.
- External email/Redis configuration is reported honestly.
- Write `docs/PHASE_4_REPORT.md` with event contracts, operational requirements, and test results.

Stop after Phase 4. Do not implement AI yet.

---

## Phase 5 — AI assistant MVP with permission-aware retrieval

**Prompt to paste:**

Read the blueprint and all previous reports. Before adding a Python service, inspect whether the required AI use cases can be implemented safely inside the NestJS API. Keep the core business logic in NestJS. Implement Phase 5 only.

Initial AI use cases:
- Summarise a selected project.
- Draft a weekly progress report for a selected workspace and date range.
- Answer a limited set of questions using workspace records the current user is authorised to access.

Implementation requirements:
1. Integrate one LLM provider through a small provider adapter. Keep API keys server-side. If provider credentials are unavailable, implement the adapter boundary and tests using explicit test doubles, but clearly mark live provider verification as blocked.
2. Add typed request/response schemas, input validation, request-size limits, timeouts, bounded retries, and safe error handling.
3. Stream responses through SSE if appropriate, including cancellation/disconnect handling and a final structured response. Do not force streaming if the chosen SDK or use case makes it unreliable.
4. Retrieve authorised records through permission-checked services before constructing the prompt. Never let the model decide which tenant data it may access.
5. Use deterministic structured outputs for summaries/reports where possible; validate model output before displaying or saving it.
6. Clearly label drafts as AI-generated. Do not silently save content or execute consequential actions.
7. Add per-user/workspace quotas, token/cost usage records, rate limits, and provider failure handling.
8. Treat user content and retrieved documents as untrusted. Add prompt-injection tests, tool allowlists, and strict argument validation if tools are introduced.
9. Use RAG/embeddings/pgvector only if the selected use cases require semantic retrieval. Do not add a vector database by default.
10. Build UI for project summaries, weekly report drafts, sources/linked records, loading/error states, and usage-limit messages.
11. Add tests proving a user cannot retrieve or summarise records outside their authorised workspace.

Acceptance criteria:
- AI works for the defined MVP tasks with a configured provider, or the precise credential/provider blocker is reported.
- The assistant cannot bypass normal access policies.
- Invalid output, timeouts, quota exhaustion, and provider failures are handled safely.
- Usage/cost tracking is persisted.
- Write `docs/PHASE_5_REPORT.md` with provider setup, threat mitigations, tests, and cost/usage limitations.

Stop after Phase 5. Do not add autonomous high-impact agents.

---

## Phase 6 — Private files, reporting, and optional subscriptions

**Prompt to paste:**

Read the blueprint and previous reports. Implement Phase 6 only, splitting work into clearly isolated subfeatures. Do not make a payment provider or object-storage provider up without real credentials and configuration.

1. **Private files:** add file metadata records and private object storage integration. Use short-lived signed upload/download URLs or an equally secure provider-supported pattern. Validate file size, content type, object key, workspace/resource permissions, and ownership. Never make private buckets public.
2. **File lifecycle:** support upload status, safe failure recovery, deletion/retention behaviour, and orphan cleanup where needed. Do not trust the browser's MIME type alone.
3. **Reports:** add useful date-filtered reports for project/task progress and workload using real authorised data. Ensure report queries are tenant-scoped and exports cannot leak data.
4. **Subscriptions:** first define plans, entitlements, usage limits, and billing states. Only integrate payments if pricing, provider availability, account configuration, and credentials are ready.
5. **Webhooks:** verify provider signatures, persist event IDs, process events idempotently, handle retries, and reconcile subscription state. Never trust frontend payment-success claims.
6. **UI:** build file lists/upload progress/errors, report filters/empty states, and billing/usage screens only for implemented capabilities.
7. **Tests:** verify unauthorised file access, invalid uploads, signed URL expiry where testable, cross-tenant exports, forged payment events, duplicate webhooks, and entitlement enforcement.

Acceptance criteria:
- Files remain private and access-controlled.
- Reports are based on persisted data and respect permissions.
- Payment state is trusted only after server-side verification.
- If external credentials are absent, provider integration is clearly marked unverified, not reported as live.
- Write `docs/PHASE_6_REPORT.md` with storage/billing configuration and security test results.

Stop after Phase 6.

---

## Phase 7 — Security hardening, end-to-end testing, and beta readiness

**Prompt to paste:**

Read the blueprint and all phase reports. Perform a security/reliability review of the actual implementation, not just the documentation. Implement Phase 7 only; do not add new product modules unless required to fix a verified defect.

1. Map all routes, authentication requirements, roles, resource policies, and tenant ownership. Find unprotected endpoints and missing checks.
2. Run and extend tests for cross-tenant access, IDOR/BOLA, privilege escalation, validation bypass, rate limits, unsafe uploads, session handling, webhook forgery, and AI retrieval boundaries as applicable.
3. Add end-to-end tests for registration/login, workspace creation/switching, invitations, client/project/task workflows, and the AI flow when configured.
4. Review SQL/query performance using realistic fixtures. Add indexes only where justified by query patterns; avoid premature optimisation.
5. Check responsive behaviour, keyboard accessibility, form errors, loading/empty/error states, and console errors on key screens.
6. Configure structured logs, error monitoring, health/readiness checks, and safe operational alerts. Do not log secrets, auth tokens, or unnecessary private content.
7. Verify backup and restore procedures using a non-production environment. Never test restore by overwriting production data.
8. Review migrations, deployment rollback strategy, dependency vulnerabilities, CORS/CSRF, secret management, privacy/retention, and account deletion requirements.
9. Produce a risk register with severity, evidence, owner/next action, and whether each issue blocks launch.
10. Fix confirmed critical/high-risk issues in scope. Do not claim a security audit or compliance certification merely because automated tests pass.

Acceptance criteria:
- Critical user journeys pass.
- No known critical/high-risk tenant-isolation or privilege-escalation defect remains unresolved without an explicit launch block.
- Monitoring, recovery, and rollback instructions exist.
- All unrun checks and residual risks are reported.
- Write `docs/PHASE_7_REPORT.md` and `docs/SECURITY_REVIEW.md`.

Stop after Phase 7. Do not launch or deploy production without explicit environment/release approval.

---

## Phase 8 — Production release and pilot launch

**Prompt to paste:**

Read the blueprint, all phase reports, the security review, and deployment configuration. Implement Phase 8 as a controlled release. Do not assume access to production credentials, DNS, payment accounts, or hosting dashboards. Never expose secrets and never perform a destructive production action without explicit approval.

1. Verify the production configuration, domains, HTTPS, secret storage, database connectivity, migrations, storage privacy, Redis/queue configuration if used, and identity-provider callback URLs.
2. Add or verify CI checks for lint, type-check, unit/integration tests, and production builds. Use deployment gates and document the rollback process.
3. Make migrations production-safe and backward-compatible where practical. Document pre-deploy backup and post-deploy verification.
4. Configure health checks, error tracking, structured logs, uptime/latency monitoring, queue alerts, AI usage/cost alerts, and backup monitoring.
5. Prepare onboarding, a support/contact path, privacy policy, terms, data retention/deletion guidance, and incident response notes. Mark legal documents as needing appropriate review where necessary.
6. Add privacy-conscious product analytics only for clearly defined events; do not collect unnecessary personal content.
7. Prepare a pilot checklist and test account/workspace procedure that uses non-sensitive data.
8. Verify the end-to-end MVP: sign in → create/switch workspace → add client → create project → create/assign task → update task → view real dashboard → use bounded AI feature if configured.
9. Write a release checklist with environment-specific steps and a go/no-go decision. If external access or credentials are unavailable, list each manual action and do not claim deployment succeeded.
10. Document post-launch metrics: activation, workflow completion, weekly active usage, retention, error rate, latency, support incidents, and AI spend. Recommend follow-up work based on measured data rather than assumptions.

Acceptance criteria:
- A release candidate is reproducible from documented steps.
- Critical end-to-end tests pass in the intended release environment.
- Rollback and restore procedures are available.
- The final report clearly distinguishes verified work from manual steps still required.
- Write `docs/PHASE_8_REPORT.md` and update the root `README.md`.

Stop after Phase 8. Do not start new modules without reviewing pilot feedback.

---

## Reusable prompt for fixing a phase that fails

Use this when a phase has incomplete tests or regressions:

Read `PROJECT_BLUEPRINT.md` and the current phase report. Inspect the actual code, test output, Git diff, and logs. Identify the root cause before editing. Fix only issues related to the current phase; preserve unrelated working code. Add or update a regression test for each confirmed bug. Run the smallest relevant test first, then the full relevant lint/type-check/test/build commands. Do not hide, skip, or weaken failing tests merely to get a green result. Update the phase report with the cause, fix, commands, results, and any unresolved blocker. Do not move to the next phase until the acceptance criteria pass.

---

## Reusable prompt for code review between phases

Review the current phase against `PROJECT_BLUEPRINT.md` and its acceptance criteria. Do not make broad changes immediately. First provide a prioritised findings list with file paths, evidence, severity, user impact, and suggested fix. Specifically inspect tenant isolation, server-side permissions, data persistence, error handling, tests, secrets, API/UI mismatches, and fake/hard-coded data. Then fix confirmed issues in-scope, add regression tests, run the relevant checks, and write/update the phase report. Clearly separate verified findings from hypotheses.

---

## Recommended execution order

- [ ] Phase 0 — Product definition and foundation
- [ ] Phase 1 — App foundation and identity
- [ ] Phase 2 — Workspaces and tenant isolation
- [ ] Phase 3 — Clients, projects, tasks, and real dashboards
- [ ] Phase 4 — Collaboration and notifications
- [ ] Phase 5 — AI assistant MVP
- [ ] Phase 6 — Files, reports, and optional subscriptions
- [ ] Phase 7 — Security and beta readiness
- [ ] Phase 8 — Controlled production release

**Final rule:** A phase is complete only when the implementation exists, relevant checks have actually run, acceptance criteria are met, and the phase report tells the truth about any remaining gaps.
"""
path = Path("/mnt/data/TriFusion_AI_Phase_Wise_Prompts.md")
path.write_text(prompts, encoding="utf-8")
print(f"Created {path} ({path.stat().st_size:,} bytes)")
