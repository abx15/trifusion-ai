# TriFusion AI - Login Credentials

> **⚠️ IMPORTANT SECURITY NOTICE**
> This file contains test credentials for development and testing purposes only.
> Never use these credentials in production environments.
> Never commit real credentials to version control.

---

## Default Test Password

All test users share the same default password:

```
Password123!
```

---

## Customer Workspace Users

### Company Workspace: Acme Innovations Corp

| Email | Role | Name | Description |
|-------|------|------|-------------|
| owner@trifusion.dev | OWNER | Alice Owner | Full workspace control, billing access |
| admin@trifusion.dev | TEAM_ADMIN | Bob Admin | Team management, project oversight |
| member@trifusion.dev | MEMBER | Charlie Member | Task assignment, project participation |
| viewer@trifusion.dev | VIEWER | Dana Viewer | Read-only access to workspace data |

---

## Platform Staff Users

| Email | Staff Role | Name | Description |
|-------|------------|------|-------------|
| superadmin@trifusion.dev | SUPERADMIN | Sam Superadmin | Full platform control, system configuration |
| platformadmin@trifusion.dev | PLATFORM_ADMIN | Paul PlatformAdmin | Tenant management, user administration |
| analyst@trifusion.dev | ANALYST | Ana Analyst | Analytics, reporting, data analysis |
| support@trifusion.dev | SUPPORT_AGENT | Sue SupportAgent | Customer support, ticket management |

---

## Test User Account Status

| Email | Status | Expected Behavior |
|-------|--------|-------------------|
| suspended@trifusion.dev | SUSPENDED | Login should be rejected with error |

---

## API Login Endpoint

### Customer Workspace Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "owner@trifusion.dev",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "owner@trifusion.dev",
      "firstName": "Alice",
      "lastName": "Owner",
      "isEmailVerified": true,
      "workspaces": [...]
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 3600
    }
  }
}
```

### Platform Staff Login

```http
POST /api/v1/platform-auth/login
Content-Type: application/json

{
  "email": "superadmin@trifusion.dev",
  "password": "Password123!"
}
```

---

## Using the Access Token

Include the access token in the Authorization header for authenticated requests:

```http
Authorization: Bearer <access_token>
```

---

## Database Seeding (Development Only)

To seed test credentials in development:

```bash
# Navigate to project root
cd trifusion-ai

# Set environment variables
export NODE_ENV=development
export ALLOW_DEV_SEED=true
export DATABASE_URL_SEED=<separate-dev-database-url>

# Run seed script
pnpm --filter @trifusion/api exec ts-node database/seeds/seed.ts
```

> **⚠️ WARNING:**
> - Requires a separate `DATABASE_URL_SEED` that differs from runtime `DATABASE_URL`
> - Seed operations are forbidden in production (`NODE_ENV=production`)
> - Never use production database URL for seeding

---

## Environment Variables Reference

Add these to your `.env.local` for local development:

```env
# Development mode
NODE_ENV=development
ALLOW_DEV_SEED=true

# Database (use separate database for seeding)
DATABASE_URL=postgresql://user:password@localhost:5432/trifusion_dev
DATABASE_URL_SEED=postgresql://user:password@localhost:5432/trifusion_seed

# JWT Secret (for development only)
JWT_SECRET=your-dev-jwt-secret-change-in-production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
```

---

## Security Best Practices

1. **Never commit real credentials** to version control
2. **Use different passwords** for production and development
3. **Rotate credentials** regularly in production
4. **Use environment variables** for all sensitive data
5. **Enable multi-factor authentication** in production
6. **Audit credential usage** regularly
7. **Use secrets management** tools like AWS Secrets Manager, HashiCorp Vault, or similar

---

## Troubleshooting

### Login Fails with "Invalid Credentials"
- Verify email and password are correct
- Check if user account is active (not suspended)
- Ensure database seeding was successful

### Token Expired
- Use the refresh token to get a new access token
- If refresh token is also expired, user must login again

### Workspace Not Found
- Verify the user has at least one workspace assigned
- Check database seeding included workspace creation

---

## Related Documentation

- [docs/SECURITY.md](docs/SECURITY.md) - Security policies and guidelines
- [docs/PRD.md](docs/PRD.md) - Product requirements and role definitions
- [docs/ADRs/ADR-002-identity-and-auth.md](docs/ADRs/ADR-002-identity-and-auth.md) - Authentication architecture decisions
