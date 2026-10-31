# TriFusion AI — Secret Rotation

> **Status:** Draft  
> **Last Updated:** 2026-10-25  
> **Purpose:** Rotation procedures for every secret in the system.

## Secrets Inventory

| Secret | Service | Rotation Frequency | Rotation Method |
|--------|---------|-------------------|-----------------|
| `DATABASE_URL` / `DIRECT_URL` | NestJS API | 90 days | Neon credentials rotation |
| `REDIS_URL` | NestJS API / Django | 90 days | Redis credentials rotation |
| `AUTH_SECRET` | NestJS API (JWT signing) | 90 days | Environment variable update + restart |
| `OPENAI_API_KEY` | Django AI service | 90 days | OpenAI dashboard rotation |
| `OBJECT_STORAGE_ACCESS_KEY` / `SECRET_KEY` | File storage | 90 days | S3-compatible provider rotation |
| `STRIPE_SECRET_KEY` / `WEBHOOK_SECRET` | Billing | 90 days | Stripe dashboard rotation |
| `SENDGRID_API_KEY` | Email | 90 days | SendGrid dashboard rotation |
| `AI_SERVICE_SHARED_SECRET` | NestJS + Django (service-to-service) | 90 days | Update both services simultaneously + restart |
| `DJANGO_SECRET_KEY` | Django AI service | 90 days | Environment variable update + restart |
| `SENTRY_DSN` | Error monitoring | 90 days | Sentry dashboard rotation |
| Refresh tokens | Per-user (database) | On logout / 7 days | Database revocation |
| Password reset tokens | Per-user (database) | 1 hour (single-use) | Automatic expiration |
| Email verification tokens | Per-user (database) | 1 hour (single-use) | Automatic expiration |
| Invitation tokens | Per-workspace (database) | Configurable expiry | Automatic expiration |

## Rotation Procedures

### 1. Database Credentials (Neon)

```bash
# 1. Generate new credentials in Neon console
# 2. Update DATABASE_URL and DIRECT_URL in secret manager
# 3. Restart API to pick up new credentials
# 4. Verify health checks pass
# 5. Revoke old credentials after 24 hours
```

### 2. JWT Secret (`AUTH_SECRET`)

```bash
# 1. Generate new secret: openssl rand -base64 32
# 2. Update AUTH_SECRET in secret manager
# 3. Restart API
# 4. All existing JWTs become invalid (users must re-login)
# 5. Revoke all refresh tokens in database
```

### 3. AI Service Shared Secret (`AI_SERVICE_SHARED_SECRET`)

```bash
# 1. Generate new secret: openssl rand -base64 32
# 2. Update in both NestJS and Django secret managers
# 3. Restart both services simultaneously
# 4. Old service tokens will fail signature verification immediately
# 5. Verify NestJS → Django calls succeed
```

### 4. Provider API Keys (OpenAI, Anthropic, etc.)

```bash
# 1. Generate new key in provider dashboard
# 2. Update in Django secret manager
# 3. Restart Django
# 4. Revoke old key in provider dashboard after 24 hours
```

### 5. Storage Credentials

```bash
# 1. Generate new access key/secret key in storage provider
# 2. Update in secret manager
# 3. Restart applications
# 4. Revoke old key after 24 hours
```

## Rotation Schedule

| Secret | Last Rotated | Next Rotation Due | Method |
|--------|--------------|-------------------|--------|
| DATABASE_URL/DIRECT_URL | Not yet | Day 90 from deploy | Neon rotation |
| AUTH_SECRET | Not yet | Day 90 from deploy | Env var + restart |
| AI_SERVICE_SHARED_SECRET | Not yet | Day 90 from deploy | Both services + restart |
| OPENAI_API_KEY | Not yet | Day 90 from deploy | Provider dashboard |
| All others | Not yet | Day 90 from deploy | Provider-specific |

**Status: Not yet rotated** — No secrets have been rotated since initial deployment.

## Emergency Rotation

If a secret is compromised:

1. **Immediate:** Revoke the compromised credential
2. **Within 1 hour:** Rotate the secret in all environments
3. **Within 4 hours:** Restart affected services
4. **Within 24 hours:** Revoke old credential
5. **Within 72 hours:** Complete incident report (see INCIDENT_RESPONSE.md)

## Secret Storage

- **Never** store secrets in Git or repository working tree
- Use platform secret manager (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault, etc.)
- Different secrets per environment (local, staging, production)
- `.env.example` contains placeholder values only
- `.env`, `.env.production` are gitignored but should not contain real credentials in working tree