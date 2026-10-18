# ADR-007: Phase 4 Frontend Session, Data Fetching, and Dashboard Rendering

## Status
Accepted

## Date
2026-10-18

## Context
Phase 4 adds customer workspace dashboards and management screens in `apps/web`, plus only the platform-admin screens backed by existing platform APIs. Browser code must not persist bearer or refresh tokens, and tenant data must not leak through a shared cache.

## Decisions

1. NestJS remains the sole owner of business logic and authorization. Next.js App Router pages render data; they do not assert access based on client-supplied workspace IDs or roles.
2. Both Next.js apps use a same-origin `/api/backend/*` server proxy. Successful login/register responses are converted to app-specific HttpOnly cookies and token fields are removed from browser-visible JSON. The proxy injects bearer tokens when forwarding to NestJS, rotates refresh tokens server-side, uses `no-store`, and rejects cross-origin state-changing requests. Production cookies are Secure and SameSite=Strict.
3. The customer workspace switcher only offers memberships returned by NestJS and validates every selection through the workspace validation endpoint. Every subsequent API request is still independently authorized by NestJS.
4. TanStack Query owns interactive client-side server state. Query keys include user ID and workspace ID, auth changes clear the cache, and API requests disable browser/Next caching. Dashboard overview is fetched in one bounded GraphQL operation; ordinary lists and mutations use REST.
5. Recharts is the charting library already present in the workspace and is dynamically loaded on dashboard pages. No chart data is generated in the browser.
6. `apps/platform-admin` remains a separate Next.js app with distinct cookie names. The shell and page links use the role returned by the protected platform-staff endpoint, while every data/action request remains protected by `PlatformRolesGuard`. Where no platform aggregate or global-settings endpoint exists, routes explain the gap without fabricated values.
7. Forms validate user input with shared Zod contracts where applicable; NestJS validation and domain rules remain authoritative. Status controls only offer documented lifecycle transitions, and the API rejects invalid transitions regardless.

## Consequences

- Browser JavaScript and persistent browser storage do not receive session tokens.
- Server-side authorization and tenant scoping remain effective even if a route is opened directly or a workspace identifier is changed.
- Client-side interactive dashboards render a stable shell and skeletons while data loads; they avoid per-widget waterfalls through a single overview query.
- Client cache state is isolated by user and workspace and is cleared at sign-in/sign-out boundaries.
- Platform screens without supporting APIs are intentionally deferred and may not show operational data yet.
