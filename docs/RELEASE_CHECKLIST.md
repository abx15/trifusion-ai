# TriFusion AI — Release Checklist

## Pre-Release

- [ ] All TypeScript typechecks pass (`pnpm typecheck` for all workspaces)
- [ ] All ESLint checks pass (`pnpm lint` for all workspaces)
- [ ] All NestJS unit tests pass (`pnpm --filter @trifusion/api test`)
- [ ] Django tests pass (`cd services/ai-django && pytest`)
- [ ] Production build succeeds (`pnpm build`)
- [ ] Database migrations reviewed and tested
- [ ] `.env` contains only placeholders (no real credentials)
- [ ] `DATABASE_URL_TEST` configured for integration tests
- [ ] Security review completed (no secrets in code)
- [ ] RBAC tested for all 8 roles (allowed + forbidden operations)

## Release

- [ ] Tag release in git (e.g., `v1.0.0`)
- [ ] Build Docker images for all services
- [ ] Deploy to staging environment
- [ ] Run smoke tests against staging
- [ ] Run e2e tests (Playwright) against staging
- [ ] Verify health endpoints (`/health`, `/ready`)
- [ ] Verify AI service endpoints
- [ ] Deploy to production

## Post-Release

- [ ] Monitor error rates (Sentry/logs)
- [ ] Monitor API latency (health endpoints)
- [ ] Verify database connections stable
- [ ] Notify stakeholders of release
- [ ] Update CHANGELOG.md
- [ ] Schedule backup restore drill

## Rollback

- [ ] Revert git tag to previous release
- [ ] Rebuild and redeploy previous Docker images
- [ ] Run database migration rollback if needed
- [ ] Verify health endpoints after rollback
