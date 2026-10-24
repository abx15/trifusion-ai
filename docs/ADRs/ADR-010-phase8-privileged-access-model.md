# ADR-010: Phase 8 Privileged Access Model

## Status
Accepted

## Date
2026-10-24

## Context
TriFusion AI platform staff (SUPERADMIN, PLATFORM_ADMIN, ANALYST, SUPPORT_AGENT) must not have automatic access to customer workspace content. However, support operations sometimes require temporary, audited access to customer data for troubleshooting or incident response.

We need a model that:
1. Prevents ambient customer data access by platform staff
2. Allows time-limited, scoped access when justified
3. Requires documented reason and approval where appropriate
4. Logs every access under a grant
5. Enforces automatic expiry and immediate revocation

## Decision
Implement a **break-glass privileged access model** using the `PrivilegedAccessGrant` table:

### Grant Lifecycle
1. **Request**: Platform staff creates a grant request with:
   - `requesterId`: staff member requesting access
   - `targetWorkspaceId`: customer workspace to access
   - `reason`: documented justification (mandatory)
   - `scope`: specific data access scope (e.g., "tasks:read", "projects:read", "full")
   - `expiresAt`: time-bound expiry (max 24 hours default, configurable)

2. **Approval** (Two-person approval for sensitive scopes):
   - For low-scope grants (e.g., read-only aggregated data): auto-approve with requester's own role
   - For high-scope grants (e.g., "full" access): requires a second approver with sufficient platform role
   - `approverId`: staff member who approved the grant
   - Status changes from `PENDING` to `ACTIVE`

3. **Access**:
   - Grants are validated on every API request
   - Grant ID is attached to request context
   - Every read/write under a grant is audited with the grant ID
   - Grant expires automatically at `expiresAt`

4. **Revocation**:
   - Grants can be revoked immediately by SUPERADMIN or PLATFORM_ADMIN
   - `revokedAt` timestamp set
   - Status changes to `REVOKED`
   - All subsequent requests with that grant ID are rejected

### Access Rules
- **ANALYST**: No customer data access even with grants (aggregates only)
- **PLATFORM_ADMIN**: Can request/approve grants, access customer data only under active grant
- **SUPERADMIN**: Can request/approve/revoke grants, access customer data only under active grant
- **SUPPORT_AGENT**: Can request grants for support cases (when support is in scope)
- No self-approval for high-scope grants
- Grant expiry is strictly enforced (no grace period)

### Audit Requirements
- Every grant request, approval, revocation logged to AuditLog
- Every data access under a grant logged with grant ID
- Grant history visible to workspace owner where policy allows
- Attempted access with expired/revoked grant logged and rejected

## Consequences
- **Positive**: Explicit audit trail, time-bounded access, no ambient access, immediate revocation capability
- **Negative**: Additional friction for support operations (intentional for security)
- **Positive**: Workspace owners can see when platform staff accessed their data
- **Negative**: Need to implement grant validation in all workspace data endpoints
