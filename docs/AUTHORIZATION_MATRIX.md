# TriFusion AI — Authorization Matrix

> **Document Status:** Active Specification  
> **Last Updated:** 2026-10-17 (Phase 2)  
> **Scope:** Workspace Roles (`apps/web`) vs Platform Staff Roles (`apps/platform-admin`)

---

## 1. Principles of Authorization Separation

1. **Strict Separation of Concerns**: Customer Workspace roles (`OWNER`, `TEAM_ADMIN`, `MEMBER`, `VIEWER`) and Platform Staff roles (`SUPERADMIN`, `PLATFORM_ADMIN`, `ANALYST`, `SUPPORT_AGENT`) exist in disjoint namespaces.
2. **Zero Implicit Customer Data Access**: Platform staff do NOT possess automatic read or write access to customer workspaces, projects, tasks, or documents. Any access for support purposes must be explicitly granted, time-bounded, and logged in `AuditLog` with an audit justification.
3. **Server-Side Derivation**: Roles, tenant memberships, and user identities are NEVER accepted from client request bodies or headers. They are derived exclusively from verified JWT authentication and fresh database queries.
4. **Immediate Revocation**: Membership revocation, role downgrades, and user suspension take effect immediately on the very next HTTP request because tenancy guards inspect database state rather than relying on stale JWT claims.

---

## 2. Workspace Roles & Permissions Matrix

Workspace permissions apply strictly within the boundaries of a specific `workspaceId`.

| Capability / Action | `OWNER` | `TEAM_ADMIN` | `MEMBER` | `VIEWER` |
|---|:---:|:---:|:---:|:---:|
| **Workspace Management** | | | | |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |
| Update workspace settings/name | ✅ | ✅ | ❌ | ❌ |
| View workspace details & stats | ✅ | ✅ | ✅ | ✅ |
| **Member Management** | | | | |
| Invite new members (MEMBER/VIEWER) | ✅ | ✅ | ❌ | ❌ |
| Invite new members as TEAM_ADMIN | ✅ | ❌ | ❌ | ❌ |
| Promote member to TEAM_ADMIN | ✅ | ❌ | ❌ | ❌ |
| Promote member to OWNER | ✅ | ❌ | ❌ | ❌ |
| Demote TEAM_ADMIN | ✅ | ❌ | ❌ | ❌ |
| Demote or remove OWNER *(1)* | ✅ *(1)* | ❌ | ❌ | ❌ |
| Remove TEAM_ADMIN, MEMBER, VIEWER | ✅ | ✅ *(2)* | ❌ | ❌ |
| Leave workspace *(3)* | ✅ *(3)* | ✅ | ✅ | ✅ |
| View member directory | ✅ | ✅ | ✅ | ✅ |
| **Invitations** | | | | |
| Issue invitation | ✅ | ✅ | ❌ | ❌ |
| Revoke invitation | ✅ | ✅ | ❌ | ❌ |
| List pending invitations | ✅ | ✅ | ❌ | ❌ |
| **Audit Logs** | | | | |
| View workspace audit logs | ✅ | ✅ | ❌ | ❌ |

### Guardrail Notes:
1. *(1) Last Owner Protection:* A workspace must always maintain at least one active `OWNER`. An `OWNER` cannot demote themselves or be removed if they are the sole owner of the workspace.
2. *(2) Team Admin Boundaries:* `TEAM_ADMIN` may only remove or update roles of `MEMBER` or `VIEWER`. They cannot modify or remove an `OWNER` or another `TEAM_ADMIN`.
3. *(3) Owner Leaving:* An `OWNER` cannot leave the workspace without either transferring primary ownership or having another active `OWNER` present.

---

## 3. Platform Staff Roles Matrix

Platform Staff roles apply globally to platform maintenance, tenant auditing, system configuration, and support operations in `apps/platform-admin`.

| Capability / Action | `SUPERADMIN` | `PLATFORM_ADMIN` | `ANALYST` | `SUPPORT_AGENT` |
|---|:---:|:---:|:---:|:---:|
| **Platform Management** | | | | |
| Assign Platform Staff Roles | ✅ | ❌ | ❌ | ❌ |
| Revoke Platform Staff Roles | ✅ | ❌ | ❌ | ❌ |
| Modify Global System Config | ✅ | ❌ | ❌ | ❌ |
| Suspend / Activate Tenant Workspace | ✅ | ✅ | ❌ | ❌ |
| Suspend / Activate User Account | ✅ | ✅ | ❌ | ❌ |
| **Analytics & Reporting** | | | | |
| View Global Platform Telemetry | ✅ | ✅ | ✅ | ❌ |
| View Aggregated Usage / Quotas | ✅ | ✅ | ✅ | ❌ |
| Export Platform Performance Metrics | ✅ | ✅ | ✅ | ❌ |
| **Auditing & Support** | | | | |
| View Global Audit Logs | ✅ | ✅ | ✅ | ❌ |
| View Tenant Audit Log Stream | ✅ | ✅ | ❌ | ❌ |
| Initiate Bounded Support Session *(4)* | ✅ | ✅ | ❌ | ✅ *(4)* |
| View Customer Workspace Content *(5)* | ❌ *(5)* | ❌ *(5)* | ❌ | ❌ *(5)* |

### Guardrail Notes:
4. *(4) Support Session Policy:* Support agents require customer consent and a documented incident ticket reference before ephemeral support access can be activated.
5. *(5) Content Isolation:* No platform role possesses ambient access to customer workspace project/task data. Every emergency support access generates an immutable `PLATFORM_SUPPORT_ACCESS` audit event with reason metadata.

---

## 4. Policy Service Interface

The `PolicyService` encapsulates these business logic constraints and is reused across REST controllers, guards, and services:

```typescript
// Core Policy Methods
requireWorkspaceRole(userId: string, workspaceId: string, requiredRole: WorkspaceRole): Promise<WorkspaceContext>;
requirePlatformRole(userId: string, requiredRole: PlatformStaffRoleType): Promise<PlatformStaffContext>;
canPromoteToRole(actorRole: WorkspaceRole, targetRole: WorkspaceRole): boolean;
canManageMember(actorRole: WorkspaceRole, targetRole: WorkspaceRole): boolean;
canRemoveMember(actorRole: WorkspaceRole, targetRole: WorkspaceRole, isSelf: boolean, ownerCount: number): boolean;
```
