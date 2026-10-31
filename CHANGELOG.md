# TriFusion AI — Changelog

## [Unreleased]

### Fixed
- **SEC-01:** AI `streamAssistant` no longer returns Django URL or signed service token to frontend. Now returns NestJS proxy URL only. (`apps/api/src/modules/ai/ai.service.ts`)
- **SEC-02:** Removed real-looking credentials from `.env`, `apps/api/.env`, `database/prisma/.env` working tree files. Replaced with safe placeholders.
- **KI-FIX-02:** Django `quota.py` in-memory fallback was a no-op (never enforced quota). Added `InMemoryQuotaStore` class with thread-safe operations. Updated test to use `store` parameter. (`services/ai-django/ai_gateway/quota.py`, `services/ai-django/tests/test_service_contract.py`)
- **KI-FIX-03:** Removed 3 unused `response` variables in `platform-auth.spec.ts` causing lint errors. (`apps/api/src/modules/platform/platform-auth.spec.ts`)
- **KI-FIX-04:** Added trailing newline to `quota.py` (ruff W292 fix).

### Added
- `docs/KNOWN_ISSUES.md` — Issue tracking for medium/low severity issues
- `docs/RELEASE_CHECKLIST.md` — Release readiness checklist
- `docs/DEPLOYMENT.md` — Deploy/migrate/rollback/smoke-test procedures
- `docs/RUNBOOK.md` — Common operational tasks and incident procedures
- `docs/INCIDENT_RESPONSE.md` — Severity levels, roles, communication, PIR template
- `docs/BACKUP_RESTORE.md` — Backup procedures, restore drills, RPO/RTO
- `docs/SECRET_ROTATION.md` — Rotation procedures for all secrets
- `docs/IMPLEMENTATION_AUDIT.md` — Phase 9 implementation audit report

## [0.1.0] — 2026-10-24

### Added
- Phase 0: Monorepo setup (pnpm + Turborepo), CI workflow, ADRs, PRD, architecture docs
- Phase 1: NestJS Auth module (register/login/refresh/logout/forgot/reset), Next.js web app, Next.js platform admin, health endpoints, Zod env validation, Django AI health
- Phase 2: Workspaces, memberships, invitations, RBAC (OWNER/TEAM_ADMIN/MEMBER/VIEWER), platform staff separation, tenant isolation guards, audit logging, security tests
- Phase 3: Client/project/task CRUD with archive/restore, GraphQL read-only API, cursor pagination, activity events, workspace settings, soft deletion
- Phase 4: Notifications module, files module, realtime module, jobs module, activity module
- Phase 5: NestJS AI service with circuit breaker, Django AI gateway with HMAC-SHA256 service token auth, scope checking, safety helpers, MockProvider, quota enforcement
- Phase 8: Platform admin app, feature flags, entitlements, privileged access grants, audit log integrity (chainHash)

### Changed
- Development roadmap updated to reflect actual implementation status

### Removed
- None

### Fixed
- Lint errors in platform-auth.spec.ts (unused variables)
- TypeScript typecheck issues across all workspaces

[0.1.0]: https://github.com/trifusion-ai/trifusion-ai/releases/tag/v0.1.0