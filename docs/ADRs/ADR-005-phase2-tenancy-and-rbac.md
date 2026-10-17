# ADR-005: Workspace Tenancy, RBAC Matrix & Audit Logging Architecture

## Status
Accepted

## Date
2026-10-17

## Context
TriFusion AI is a multi-tenant platform serving freelancers, agencies, and enterprise IT companies. In Phase 2, we must establish:
1. Multi-tenant isolation: how tenant context is resolved and verified.
2. Authorization hierarchy: how workspace roles (`OWNER`, `TEAM_ADMIN`, `MEMBER`, `VIEWER`) and platform staff roles (`SUPERADMIN`, `PLATFORM_ADMIN`, etc.) are separated.
3. User status handling: immediate enforcement of suspended or deleted states.
4. Audit logging: append-only compliance tracking for sensitive mutations.
5. Soft-delete vs Cascade policy for tenant data.

## Decision
1. **Tenancy Resolution via Server-Side Guards**:
   - Client-provided workspace identifiers (`x-workspace-id` header or route parameters `:workspaceId`) are never trusted.
   - The `WorkspaceGuard` queries the database on every request to verify active membership (`WorkspaceMember.status === 'ACTIVE'`).
   - If membership is absent or revoked, the request is immediately rejected with HTTP 403 Forbidden.
2. **Strict RBAC Hierarchy & Escalation Guardrails**:
   - `OWNER > TEAM_ADMIN > MEMBER > VIEWER`.
   - `TEAM_ADMIN` cannot promote anyone to `OWNER`, demote an `OWNER`, or modify another `TEAM_ADMIN`.
   - Workspaces must always maintain at least one active `OWNER`. Sole owners cannot demote themselves or leave without transferring ownership.
3. **Platform Staff Decoupling**:
   - Platform staff roles are stored in `PlatformStaffRole` and only accessible via `PlatformRolesGuard`.
   - Platform staff have zero ambient access to customer workspace data.
4. **Active Status Verification on Every Request**:
   - The `JwtStrategy` verifies that `User.status === 'ACTIVE'` on every authenticated request, instantly rejecting suspended or deleted accounts.
5. **Append-Only Audit Logging**:
   - All sensitive events (logins, failures, workspace creation, membership updates, role changes, invitations) are logged to `AuditLog` with correlation IDs. No update or delete operations are exposed on the `AuditLog` entity.

## Consequences
- **Positive**: Complete defense against cross-tenant IDOR, zero stale permissions risk, full audit compliance.
- **Negative**: Database lookup overhead on protected tenant routes (mitigated by indexed compound queries on `workspaceId_userId`).
