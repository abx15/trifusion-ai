# ADR-003: Platform Admin Separation

## Status
Accepted

## Date
2026-10-15

## Context
TriFusion AI has two distinct administrative paradigms:
1. Customer Workspace Administration: Managed by customers with the `TEAM_ADMIN` or `OWNER` role inside their own isolated workspace tenant (`apps/web`).
2. Internal Platform Administration: Required by TriFusion internal staff (`SUPERADMIN`, `PLATFORM_ADMIN`, `ANALYST`) to monitor system health, inspect tenant quotas, and manage global platform configuration.

We had to decide whether to bundle platform administration into `apps/web` or separate it into `apps/platform-admin`.

## Decision
Maintain `apps/platform-admin` as a dedicated Next.js application strictly separated from `apps/web`:
- Platform staff roles (`SUPERADMIN`, `PLATFORM_ADMIN`, `ANALYST`) operate only through `apps/platform-admin`.
- Customer roles (`OWNER`, `TEAM_ADMIN`, `MEMBER`, `VIEWER`) have no access to platform admin routes.
- Eliminates any risk of leaking platform-wide administrative controls or bundles into the customer client application.

## Consequences
- **Positive**: Strict least-privilege security boundary, independent deployment and access control, clean codebase separation.
- **Negative**: Monorepo maintains an additional Next.js application shell.

