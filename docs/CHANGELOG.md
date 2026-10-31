# TriFusion AI — Changelog

## [Unreleased]

### Added
- Material UI v7 design system (`packages/ui`) with 20+ components
- Premium color palette: Primary #003F5C, Secondary #58508D, Purple #8A508F, Pink #BC5090, Coral #FF6361, Orange #FF8531, Amber #FFA600
- Light and dark theme support
- 8 role-specific dashboards (4 customer + 4 platform)
- Role-based navigation and widget configuration
- Centralized role contracts in `packages/contracts/src/roles.ts`
- Documentation: DEPLOYMENT.md, RUNBOOK.md, BACKUP_RESTORE.md, RELEASE_CHECKLIST.md, KNOWN_ISSUES.md, CHANGELOG.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, IMPLEMENTATION_REPORT.md, ROLES_REFERENCE.md

### Changed
- Next.js upgraded from 14.1.0 → 16.0.0 (web + platform-admin)
- React upgraded from 18.2.0 → 19.3.1
- Cookie names aligned to `accessToken`/`refreshToken` across API and both proxies
- Dashboard layout now role-aware (OWNER, TEAM_ADMIN, MEMBER, VIEWER)
- Platform admin dashboards now fetch real data from API

### Fixed
- Critical: Cookie naming mismatch that broke end-to-end authentication (401 on all authenticated requests)
- TypeScript typecheck errors across all packages

### Removed
- None

## [1.0.0] — Initial Release

- NestJS 10 API with REST + GraphQL
- Next.js 14 customer and platform admin apps
- Prisma 5 + Neon PostgreSQL with 22 models
- Authentication: login, register, logout, refresh, password reset
- RBAC: 4 workspace roles + 4 platform staff roles
- Core modules: workspaces, clients, projects, tasks, activity, notifications, files, audit
- AI service: NestJS + Django integration with circuit breaker
