# ADR-012: Phase 8 Feature Flag Evaluation

## Status
Accepted

## Date
2026-10-24

## Context
Feature flags allow controlled rollout of new functionality. We need a system that:
- Evaluates flags server-side (client cannot influence)
- Supports different scopes (global, per-plan, per-workspace)
- Provides safe caching with invalidation
- Includes kill-switch capability
- Tracks all flag changes with history

## Decision
Implement **server-authoritative feature flag evaluation** with scoped targeting:

### Flag Data Model
- `FeatureFlag`: key, description, type (boolean/string/number/json), defaultValue, rules (JSONB), status (ACTIVE/DISABLED/KILLED)
- `FeatureFlagChange`: history of all changes with actor, reason, before/after state

### Evaluation Rules
1. **Default value**: Used if no targeting rules match
2. **Targeting rules** (evaluated in order):
   - Global: if flag is enabled globally, return value
   - Plan: if workspace's plan matches targeting, return value
   - Workspace: if specific workspace ID matches, return value
   - User: if specific user ID matches, return value
3. **Kill switch**: If status is `KILLED`, flag is disabled regardless of rules
4. **Cache key**: `flag:{key}:scope:{workspaceId}:{planId}` to ensure tenant-safe caching

### Caching Strategy
- Cache evaluated results in Redis with short TTL (60 seconds default)
- Cache invalidated immediately on flag update
- Tenant-scoped cache keys prevent cross-tenant cache poisoning
- Fallback to database if cache miss

### Evaluation Flow
```
1. Check cache for flag:{key}:scope:{workspaceId}:{planId}
2. If cache hit, return cached value
3. If cache miss:
   a. Fetch flag from database
   b. If status is KILLED, return false/kill value
   c. If status is DISABLED, return default value
   d. Evaluate targeting rules in order
   e. Cache result with tenant-scoped key
   f. Return result
```

### API Contract
- NestJS endpoint: `GET /api/v1/feature-flags/evaluate?key={key}&workspaceId={workspaceId}`
- Internal service method: `FeatureFlagService.evaluate(key, context)`
- Django AI service can call NestJS endpoint to evaluate flags
- Frontend calls NestJS endpoint (never evaluates client-side)

### Change Tracking
- Every flag change creates `FeatureFlagChange` record
- Includes: actorId, reason, before state, after state
- Changes visible in platform admin UI
- Audit log entry created for each change

### Kill Switch
- Status `KILLED` means flag is immediately disabled everywhere
- No targeting rules are evaluated when killed
- Intended for emergency disable of problematic features
- Requires SUPERADMIN to set status to KILLED

## Consequences
- **Positive**: Server-authoritative, no client influence
- **Positive**: Tenant-safe caching
- **Positive**: Kill switch for emergencies
- **Positive**: Complete change history
- **Negative**: Cache invalidation complexity (minimal with simple key structure)
- **Positive**: Easy to test with mock flag service
