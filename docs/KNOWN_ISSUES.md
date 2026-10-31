# TriFusion AI — Known Issues

## Critical (Blockers for Release)

| ID | Issue | Impact | Workaround |
|----|-------|--------|------------|
| KI-01 | Integration tests require `DATABASE_URL_TEST` — no test database configured | Cannot verify Phase 3/4 tenant isolation, CRUD, cross-tenant security | Manual verification against staging |
| KI-02 | No Playwright e2e tests exist | Cannot verify critical user journeys end-to-end | Manual QA |
| KI-03 | No SAST/secret scan in CI | Potential secrets or vulnerabilities undetected | Manual secret review before deploy |

## Medium

| ID | Issue | Impact | Workaround |
|----|-------|--------|------------|
| KI-04 | 71 `no-explicit-any` lint warnings | Reduced type safety | Fix incrementally |
| KI-05 | Django `.python-version` requires 3.12.10, env has 3.11.9 | Python version mismatch | Use pyenv or update `.python-version` |
| KI-06 | No Python type checking (mypy/pyright) | Undetected Python type errors | Add mypy to CI |
| KI-07 | No CSP headers configured | Reduced XSS protection | Add CSP headers in middleware |
| KI-08 | CORS origin validation not strictly verified | Potential cross-origin issues | Verify CORS config |

## Low

| ID | Issue | Impact | Workaround |
|----|-------|--------|------------|
| KI-09 | GraphQL introspection not disabled in production | Schema introspection available | Disable in production middleware |

## Resolved Issues

| ID | Issue | Resolution |
|----|-------|------------|
| RI-01 | Cookie naming mismatch (API `accessToken` vs proxy `trifusion_access`) | Aligned both to `accessToken`/`refreshToken` |
| RI-02 | Next.js 14 (EOL) | Upgraded to Next.js 16 |
| RI-03 | React 18 | Upgraded to React 19 |
| RI-04 | No Material UI design system | Built MUI design system in `packages/ui` |
| RI-05 | AI streamAssistant leaked Django URL/token | Fixed — returns relative NestJS proxy URL only |
| RI-06 | Platform admin was placeholder UI | Built 4 role-specific platform dashboards |
| RI-07 | No role-specific customer dashboards | Built 4 role-specific customer dashboards |
