# TriFusion AI - Test Login Credentials

All test users share the same password:

**Password:** `Password123!`

---

## Workspace Users (Company Workspace: Acme Innovations Corp)

| Email | Role | Name |
|-------|------|------|
| owner@trifusion.dev | OWNER | Alice Owner |
| admin@trifusion.dev | TEAM_ADMIN | Bob Admin |
| member@trifusion.dev | MEMBER | Charlie Member |
| viewer@trifusion.dev | VIEWER | Dana Viewer |

---

## Platform Staff Users

| Email | Staff Role | Name |
|-------|------------|------|
| superadmin@trifusion.dev | SUPERADMIN | Sam Superadmin |
| platformadmin@trifusion.dev | PLATFORM_ADMIN | Paul PlatformAdmin |
| analyst@trifusion.dev | ANALYST | Ana Analyst |
| support@trifusion.dev | SUPPORT_AGENT | Sue SupportAgent |

---

## Negative Test User

| Email | Status | Note |
|-------|--------|------|
| suspended@trifusion.dev | SUSPENDED | Login should be rejected |

---

## Login Endpoint

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "owner@trifusion.dev",
  "password": "Password123!"
}
```

Response returns `tokens.accessToken`. Use that token in the `Authorization: Bearer <token>` header to access dashboard endpoints.

---

## How to Seed (Development Only)

```bash
NODE_ENV=development \
ALLOW_DEV_SEED=true \
DATABASE_URL_SEED=<separate-dev-database-url> \
pnpm --filter @trifusion/api exec ts-node database/seeds/seed.ts
```

> **Warning:** Requires a separate `DATABASE_URL_SEED` that differs from runtime `DATABASE_URL`. Forbidden in production.
