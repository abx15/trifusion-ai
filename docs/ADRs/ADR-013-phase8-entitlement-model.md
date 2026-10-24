# ADR-013: Phase 8 Entitlement Model

## Status
Accepted

## Date
2026-10-24

## Context
TriFusion AI needs to enforce usage limits and feature access based on workspace plans. Requirements:
- Server-authoritative entitlement checking (frontend cannot bypass)
- Plan definitions with configurable limits
- Per-workspace overrides when needed
- Graceful over-limit behavior
- Clear error messages
- Migration path when plans change

## Decision
Implement **server-enforced entitlement model** with Plan and Entitlement tables:

### Data Model
- `Plan`: key (e.g., "free", "pro", "enterprise"), name, limits (JSONB)
- `Entitlement`: workspaceId, planId, effectiveFrom, effectiveTo, overrides (JSONB)

### Plan Limits Structure
```json
{
  "seats": 10,
  "projects": 50,
  "storage": 10737418240,  // bytes (10GB)
  "aiQuota": {
    "dailyRequests": 100,
    "dailyTokens": 50000
  },
  "features": {
    "advancedAnalytics": true,
    "customIntegrations": false
  }
}
```

### Enforcement Points
- **Seat limits**: Enforced when inviting members (check active member count < limit)
- **Project limits**: Enforced when creating projects (check project count < limit)
- **Storage limits**: Enforced when uploading files (check total storage < limit)
- **AI quota**: Enforced before AI requests (check daily usage < limit)
- **Feature flags**: Some features enabled/disabled based on plan

### Evaluation Logic
1. Get workspace's active entitlement (current date within effectiveFrom/effectiveTo)
2. Merge plan limits with workspace-specific overrides (overrides take precedence)
3. Check against current usage for the resource
4. If over limit, return clear error with upgrade guidance

### Graceful Over-Limit Behavior
- **Soft limits (warnings)**: Allow operation but warn about approaching limit
- **Hard limits (enforced)**: Block operation with clear error message
- **Grandfathering**: Existing workspaces retain old limits until manual change
- **No silent deletion**: Downgrades do not delete data, just prevent new actions

### Entitlement Service
- `EntitlementService.checkLimit(workspaceId, resourceType)`: Returns true/false with usage info
- `EntitlementService.getCurrentEntitlement(workspaceId)`: Returns merged plan + overrides
- `EntitlementService.getUsage(workspaceId, resourceType)`: Returns current usage
- Cached with short TTL (5 minutes) to avoid excessive database queries

### Plan Changes
- Plan definitions can be updated by SUPERADMIN
- Changes affect new workspaces and workspaces on auto-renew
- Manual per-workspace overrides can grandfather legacy limits
- Plan changes logged to audit log

## Consequences
- **Positive**: Server-enforced, frontend cannot bypass
- **Positive**: Flexible with per-workspace overrides
- **Positive**: Clear upgrade paths and error messages
- **Negative**: Additional check at each enforcement point (necessary for security)
- **Positive**: Support for complex limit types (seats, storage, AI quota)
- **Positive**: Easy to add new limit types
