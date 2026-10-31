# Phase 9 Plan: Hardening, Testing, Deployment and Release (TriFusion AI)

## Goal
Audit, harden, test, document, deploy and release what exists. Fix defects and gaps found. No new product features. Follow adversarial review - only mark release-ready if proven by tests/commands. If critical/high issues remain, verdict is NO-GO.

## Steps

### Step 1: FULL REPOSITORY AUDIT
- [ ] Read every file in `docs/` (PRD, SYSTEM_ARCHITECTURE, DATABASE_DESIGN, API_CONTRACTS, AUTHORIZATION_MATRIX, SECURITY, AI_SAFETY, ANALYTICS_METRICS, PERFORMANCE, TEST_STRATEGY, DEVELOPMENT_ROADMAP) and all ADRs
- [ ] Produce implementation inventory: working/partial/broken/missing/dead code/TODO-FIXME/mock data/unused deps/unused env vars
- [ ] Verify docs match code (API_CONTRACTS vs routes/GraphQL, AUTHORIZATION_MATRIX vs guards, DATABASE_DESIGN vs Prisma/Django models, .env.example vs env validation in each service)
- [ ] Fix critical/high now, record medium/low in `docs/KNOWN_ISSUES.md` with severity/impact/owner

### Step 2: QUALITY GATES AND TEST SUITES
- [ ] Run/fix lint, format check, typecheck (all TS), Python linters/type checks
- [ ] Run unit, integration, security, e2e (Playwright), contract tests (NestJS<->Django, frontend<->API), builds for all apps/services
- [ ] Measure coverage, report, set thresholds for critical modules (auth, authorization, billing/webhooks if present, file access, tenant scoping, AI boundary). Focus risk-based, no gaming
- [ ] Fix/remove flaky tests (deterministic, isolated, runnable against clean Neon test branch)
- [ ] Ensure CI runs all on PRs and blocks merging; add nightly for slower suites if needed

### Step 3: DATABASE AND MIGRATIONS
- [ ] Verify migrations from empty Neon branch (Prisma via DIRECT_URL, Django migrations for its schema) and upgrade path from earlier migration state
- [ ] Confirm no drift (`prisma migrate diff` / `Django makemigrations --check`)
- [ ] Review each migration for lock risk/data safety on populated DB; use expand/contract for risky changes
- [ ] Document migration procedure and rollback strategy (forward-fix, Neon PITR/branching)
- [ ] Neon specifics: pooled vs direct URLs, pool limits/timeouts for Neon compute/limits, cold-start retry/backoff, compute size/autoscaling/cost implications, SSL enforced
- [ ] Backups/restore: document and TEST restore drill (Neon branch restore/PITR/logical dump), record time and result, define RPO/RTO from measurements
- [ ] Retention/deletion: verify user/workspace/AI data/file object deletion and audit-log retention as documented (what must be kept); provide data export procedure if PRD requires
- [ ] Confirm indexes/slow queries from Phase 5 hold on final schema; re-run performance checks

### Step 4: SECURITY HARDENING AND AUDIT
- [ ] Defensive review: authN/Z, REST/GraphQL, DB access, background jobs, files, realtime, Django AI boundary, admin/platform, billing
- [ ] Tenant isolation: extend tests for IDOR/BOLA across REST/GraphQL/jobs/AI/storage/SSE/WebSocket/caches; systematic test enumerating every route/resolver with auth+tenant coverage
- [ ] AuthN: session expiry, refresh rotation+reuse detection, logout everywhere, password policy/hashing, brute-force/rate limits, account lockout/enumeration resistance, token/cookie flags, CSRF, access revocation immediate
- [ ] Input/output: validation on every DTO, output encoding in UI, upload hardening, SSRF review for server-side URL fetch, injection (SQL/raw, NoSQL-like, GraphQL), prompt-injection regression tests for AI
- [ ] Transport/headers: HTTPS only, HSTS, secure cookies, CSP, X-Content-Type-Options, frame protections, strict CORS (no wildcard with credentials), Referrer-Policy, Permissions-Policy
- [ ] Secrets: scan repo+git history (gitleaks/trufflehog), confirm no secrets in client bundles/logs/error responses/docs; document rotation for every secret (DB, Redis, storage, JWT/service signing, provider/billing, webhook)
- [ ] Dependencies: audit Node/Python (pnpm/npm audit, pip-audit), pin/update vulns, enable Dependabot/Renovate, generate SBOM if feasible, scan container images if used
- [ ] Static analysis: CodeQL or equivalent SAST + secret scanning in CI
- [ ] Rate limiting/abuse: per-IP/user/workspace on auth/analytics/AI/upload/webhook; GraphQL depth/complexity/timeouts
- [ ] Privileged access: platform role separation, break-glass grants, audit-log append-only/tamper-evidence, first-SUPERADMIN bootstrap one-time/cannot run accidentally in prod, no default creds, seeds refuse prod
- [ ] Fix every verified critical/high, add regression test for each, document residual risks in `docs/SECURITY.md` and `docs/KNOWN_ISSUES.md`. Safe tests only against local/test envs.

### Step 5: RELIABILITY, OBSERVABILITY AND OPERATIONS
- [ ] Health/readiness: `/health` (liveness), `/ready` (checks DB, Redis, queue, storage, Django reachability where required) for every service; startup config validation fails fast
- [ ] Graceful shutdown for API/workers/Django/realtime (finish/requeue in-flight, drain connections)
- [ ] Timeouts, retries with backoff+jitter, circuit breakers on external calls (AI/email/storage/billing); explicit behavior when deps down (degrade/queue/fail clearly). Test Redis outage, Neon cold start/connection exhaustion, Django outage
- [ ] Structured JSON logs with correlation IDs across web/API/workers/Django; log levels; PII/secret redaction verified by tests; log retention policy
- [ ] Error monitoring (e.g. Sentry) with release tagging, source maps handled safely, PII scrubbing, alert routing
- [ ] Metrics/alerts: latency (p50/p95), error rate, queue depth/failed jobs, DB conn usage, cache hit rate, AI cost/quota, webhook failures, storage growth, cert expiry, backup success. Define thresholds/severities/notifications. Uptime checks against health endpoints
- [ ] Cost controls: AI spend limits/alerts, Neon compute/storage limits, storage lifecycle rules, Redis plan limits. Document expected monthly costs at launch scale and main drivers. No K8s/multiple DBs/extra services without demonstrated need

### Step 6: PERFORMANCE, ACCESSIBILITY AND UX CHECKS
- [ ] Re-run Phase 5 load tests on final build (Neon perf branch, documented compute size). Compare vs baseline/SLOs; investigate regressions. State only measured
- [ ] Frontend budgets: Lighthouse (perf/a11y/best practices/SEO where relevant) on key pages mobile+desktop; bundle size review; Core Web Vitals targets from measurements
- [ ] Accessibility: automated axe in Playwright + manual keyboard-only and screen-reader pass on main flows (login, dashboard, CRUD, file upload, notifications, admin). Fix blocking issues
- [ ] Responsive checks at mobile/tablet/desktop for all main flows; error pages (404/403/500), offline/reconnecting, empty, loading states verified

### Step 7: DEPLOYMENT AND INFRASTRUCTURE
- [ ] Choose/document (ADR) managed budget-appropriate hosting per component (Next.js on Vercel/Node host, NestJS API+workers container/PaaS, Django AI private/internal, Neon Postgres, managed Redis, S3-compatible storage, CDN/WAF where useful). Keep Django non-public
- [ ] Reproducible deployment: Dockerfiles (multi-stage, non-root, minimal, pinned base, healthchecks) only where containers used; build scripts; env-specific config local/staging/prod; IaC or documented step-by-step in infrastructure/
- [ ] Environments: staging mirrors prod (separate Neon project/branch, separate Redis/storage/keys), prod separate. Secrets in platform secret manager, never Git, differ per env
- [ ] CI/CD: install/lint/typecheck/test/security scans/build/migrate (staging first, approval gate for prod)/deploy/post-deploy smoke tests/auto-rollback or documented one-command rollback. Version/tag releases, CHANGELOG
- [ ] Zero/low-downtime for API/workers (compatible migrations, rolling/blue-green if supported), worker drain on deploy, documented procedure running migrations before app rollout
- [ ] Domain/DNS/TLS/cert renewal, HSTS, CORS/cookie domain per env; email domain setup (SPF/DKIM/DMARC) if used; storage bucket CORS/access policies
- [ ] Webhooks/external callbacks: verify public endpoints, signature validation, replay protection in staging with real provider test mode if billing/email in scope

### Step 8: RUNBOOKS, DOCS AND RELEASE PROCESS
Create/update:
- [ ] `docs/DEPLOYMENT.md` - exact deploy/migrate/rollback/smoke-test per env
- [ ] `docs/RUNBOOK.md` - common tasks and incidents (API down, DB conn exhaustion, queue backlog, Redis outage, AI provider outage/cost spike, storage issues, failed webhooks, suspected leak/compromised creds, lost SUPERADMIN access)
- [ ] `docs/INCIDENT_RESPONSE.md` - severity levels/roles/communication/post-incident review template
- [ ] `docs/BACKUP_RESTORE.md` - procedures + drill results
- [ ] `docs/SECRET_ROTATION.md`
- [ ] `docs/RELEASE_CHECKLIST.md`, `docs/KNOWN_ISSUES.md`, `CHANGELOG.md`, final `README.md` (prereqs/local setup/running tests/deploying), `CONTRIBUTING.md`/dev guide, updated ARCHITECTURE diagram (Mermaid)
- [ ] Legal/compliance basics as PRD requires: privacy policy/terms placeholders flagged for legal review, cookie notice if needed, data processing notes for AI providers, data residency notes. Mark anything needing professional legal review; don't claim compliance (GDPR/SOC2/DPDP) not assessed
- [ ] Update `docs/DEVELOPMENT_ROADMAP.md` with final status of every phase

### Step 9: RELEASE REHEARSAL AND GO/NO-GO
- [ ] Full staging rehearsal from scratch: provision, migrate on empty DB, deploy all services, bootstrap first SUPERADMIN via documented one-time procedure, create two workspaces with different roles, run full e2e suite and smoke tests, exercise AI with real provider (low spend limit), upload/scan/download file, trigger notifications/realtime, run rollback, run restore drill
- [ ] Produce `docs/RELEASE_READINESS_REPORT.md` with: checklist pass/fail + evidence (exact commands/outputs or CI links), test/coverage summary, security findings/status, perf vs SLOs, a11y results, operational readiness (monitoring/alerts/backups/runbooks), cost estimate, known limitations, final GO/NO-GO verdict
- [ ] Verdict rules: any failing critical test, open critical/high security finding, unverified migration path, untested restore, missing rollback plan, or tenant-isolation test failure => NO-GO. Say so plainly with exact blockers

## Verification (mandatory)
1. Clean install + full pipeline: `pnpm install`, lint, typecheck, test (unit/integration/security), build; Python lint/tests; Playwright e2e
2. Migrations on empty Neon branch and upgraded branch; drift checks
3. Dependency audits, secret scan, SAST results
4. Load test results vs baseline and SLO targets
5. Lighthouse and axe results
6. Backup/restore drill with measured timings
7. Staging deploy, smoke tests, rollback test, failure-injection tests (Redis, Django, DB cold start)
8. Final `RELEASE_READINESS_REPORT.md` with GO/NO-GO verdict

## Rules
- No new features. No placeholder implementations, dummy data, hardcoded credentials or "fix later" for critical issues
- Never trust client-supplied role/userId/workspaceId/plan/payment state
- Add technology only if measured need and ADR justify
- Update .env.example and env validation everywhere (fake placeholders only); never print/commit secrets
- Never claim secure/scalable/compliant/release-ready without evidence

## Deliverables
All docs created/updated, issues fixed or recorded, full verification with evidence, final GO/NO-GO report.
