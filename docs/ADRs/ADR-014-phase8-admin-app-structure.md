# ADR-014: Phase 8 Platform Admin App Structure

## Status
Accepted

## Date
2026-10-24

## Context
TriFusion AI needs a dedicated platform administration interface for staff roles (SUPERADMIN, PLATFORM_ADMIN, ANALYST). This is separate from customer workspace administration.

Requirements:
- Strict separation from customer app (`apps/web`)
- Role-based access (different screens for different platform roles)
- No customer data exposure without explicit grants
- Server-side route protection (not just UI hiding)
- Real-time data from platform APIs
- Clear audit trail for all admin actions

## Decision
Maintain `apps/platform-admin` as a dedicated Next.js application with the following structure:

### Route Structure
```
/platform-admin
  /login                    # Staff-only login (can use same auth as web app)
  /dashboard                # Platform health overview (all staff)
  /health                   # Service health details (PLATFORM_ADMIN, SUPERADMIN)
  /workspaces               # Workspace list and status (PLATFORM_ADMIN, SUPERADMIN)
  /workspaces/:id           # Workspace details and suspension (PLATFORM_ADMIN, SUPERADMIN)
  /users                    # User list and status (PLATFORM_ADMIN, SUPERADMIN)
  /users/:id                # User details and suspension (PLATFORM_ADMIN, SUPERADMIN)
  /staff-roles              # Staff role management (SUPERADMIN only)
  /feature-flags            # Feature flag management (SUPERADMIN, PLATFORM_ADMIN)
  /plans                    # Plan and entitlement management (SUPERADMIN)
  /audit                    # Audit log search (ANALYST, PLATFORM_ADMIN, SUPERADMIN)
  /audit/integrity          # Audit integrity check (SUPERADMIN)
  /analytics                # Platform aggregate analytics (ANALYST, PLATFORM_ADMIN, SUPERADMIN)
  /grants                   # Privileged access grant management (PLATFORM_ADMIN, SUPERADMIN)
  /grants/:id               # Grant details and approval (PLATFORM_ADMIN, SUPERADMIN)
```

### Authentication
- Uses same auth service as `apps/web` (shared JWT/session)
- Additional check: user must have active PlatformStaffRole
- Redirect to customer app if no platform role
- Shorter session timeout for staff (1 hour instead of 7 days)

### Authorization
- Server-side protection: Every API call checks platform role
- Client-side protection: Role-based menu hiding (UX, not security)
- Route guards: Prevent navigation to unauthorized routes
- Break-glass banner: Show when acting under a PrivilegedAccessGrant

### Data Fetching
- All data from NestJS platform APIs
- TanStack Query for caching and invalidation
- No mock data or fake metrics
- Clear loading/error/empty states
- Real-time updates where needed (WebSocket for health checks)

### UI/UX Principles
- Accessible, responsive layouts
- Clear distinction between read-only and mutating actions
- Confirmation dialogs for sensitive actions with mandatory reason field
- Audit log trail visible for all mutations
- No secrets or private customer content displayed

### Security Headers
- Content-Security-Policy: Restrict to admin domain
- X-Frame-Options: DENY (prevent clickjacking)
- Strict-Transport-Security: Enforce HTTPS in production
- X-Content-Type-Options: nosniff

### Deployment
- Separate domain (e.g., admin.trifusion.ai)
- IP restriction in production (optional, configurable)
- Rate limiting for admin routes
- Not indexed by search engines
- Logs to separate security audit stream

## Consequences
- **Positive**: Clear separation of concerns
- **Positive**: Role-based access controls
- **Positive**: Server-side enforcement
- **Positive**: Security-focused on admin operations
- **Negative**: Additional Next.js app to maintain
- **Positive**: Isolated security posture for admin operations
