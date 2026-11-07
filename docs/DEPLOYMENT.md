# TriFusion AI — Deployment Guide

> **Document Status:** Active Specification  
> **Last Updated:** 2026-10-31  
> **Scope:** Production and staging deployment of all TriFusion AI services

---

## Overview

TriFusion AI is a monorepo with four deployable services:

| Service | Location | Port | Technology |
|---------|----------|------|------------|
| Customer Web Dashboard | `apps/web` | 3000 | Next.js 16 |
| NestJS API | `apps/api` | 3001 | NestJS 10 |
| Platform Admin Portal | `apps/platform-admin` | 3002 | Next.js 16 |
| Django AI Service | `services/ai-django` | 8000 | Django 5.x |

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | >=18 | Runtime for Next.js and NestJS apps |
| pnpm | >=8 | Package manager (pinned to 8.15.0) |
| Python | >=3.12 | Django AI service |
| pip | latest | Python package management |
| PostgreSQL | 15+ | Primary database (Neon recommended) |
| Redis | 7+ | Optional Bull v4 AI job queue; the core API can run without it |
| Docker | Optional | Containerized deployment only; not required for the current Render services |
| Docker Compose | Optional | Local multi-service orchestration |

---

## Environment Variables

### Root `.env` (Required for all apps)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL pooled connection | Yes | `postgresql://...` |
| `DIRECT_URL` | Direct Neon connection for migrations | Yes | `postgresql://...` |
| `NODE_ENV` | Environment mode | No | `development` \| `production` |
| `PORT` | API server port | No | `3001` |

### `apps/api/.env` (Required)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection | Yes | `postgresql://...` |
| `DIRECT_URL` | Direct connection for Prisma migrations | Yes | `postgresql://...` |
| `AUTH_SECRET` | JWT signing secret (32+ chars in prod) | Yes | `your-32-char-secret-here` |
| `AUTH_EXPIRES_IN` | Access token lifetime | No | `15m` |
| `AUTH_REFRESH_EXPIRES_IN` | Refresh token lifetime | No | `7d` |
| `WEB_URL` | Customer web origin | No | `https://app.trifusion.ai` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | No | `https://app.trifusion.ai,https://admin.trifusion.ai` |
| `REDIS_URL` | Redis connection for Bull v4 AI jobs; without it the AI queue/worker is disabled while the core API remains available | No | `redis://redis:6379` |
| `AI_SERVICE_URL` | Django AI backend URL | No | `http://django:8000` |
| `AI_SERVICE_SHARED_SECRET` | HMAC secret for service tokens | No | `32-char-hmac-secret` |
| `STRIPE_SECRET_KEY` | Stripe payment key | No | `sk_live_...` |
| `SENDGRID_API_KEY` | SendGrid SMTP credential (or configure SMTP_HOST/SMTP_USER/SMTP_PASSWORD) | Required for SendGrid |
| `SENDGRID_FROM_EMAIL` or `EMAIL_FROM` | Verified sender address used for verification and password-reset emails | Required for email delivery |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Alternative SMTP transport configuration | Required when not using SendGrid |
| `AWS_S3_BUCKET` | File storage bucket name | No | `trifusion-files` |

### `services/ai-django/.env` (Required for the AI service)

| Variable | Description | Required in production |
|----------|-------------|-------------------------|
| `DJANGO_ENV` | Django environment; use `production` on Render | Yes |
| `DJANGO_DEBUG` | Must be `False` in production | Yes |
| `DJANGO_SECRET_KEY` | Unique Django signing secret, at least 50 characters | Yes |
| `DATABASE_URL` or `DJANGO_DATABASE_URL` | PostgreSQL connection for Django usage/quota tables | Yes |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated explicit Render hostnames | Yes |
| `DJANGO_CORS_ALLOWED_ORIGINS` | Explicit browser origins; keep empty if browser does not call Django directly | As required |
| `AI_SERVICE_SHARED_SECRET` | Must exactly match the NestJS value | Yes |
| `AI_PROVIDER` | `openai` or `anthropic`; mock is development/test only | Yes |
| `AI_OPENAI_API_KEY` | OpenAI provider credential | If provider is OpenAI |
| `AI_ANTHROPIC_API_KEY` | Anthropic provider credential | If provider is Anthropic |

Use the Django service's own PostgreSQL URL where possible. Prisma's `?schema=public` parameter is stripped before Django connects; non-public schema values are rejected. Configure the Django Render health-check path as `/ready` so deployment readiness verifies its database and configured AI provider. Configure the NestJS Render health-check path as `/api/v1/ready`; its liveness endpoint is `/api/v1/health`.

**Redis note:** Redis is not currently provisioned in the user's deployment. Leave `REDIS_URL` unset until a Redis instance is available. Background AI jobs will remain unavailable; do not describe them as working until queue processing is verified.

### `apps/web/.env` (Required)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Public API URL (no credentials) | Yes | `https://api.trifusion.ai` |
| `API_INTERNAL_URL` | NestJS Render Web Service URL, server-only; include `/api/v1` or let the BFF append it | Yes | `https://<nestjs-service>.onrender.com/api/v1` |

### `apps/platform-admin/.env` (Required)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Public API URL (no credentials) | Yes | `https://api.trifusion.ai` |
| `API_INTERNAL_URL` | NestJS Render Web Service URL, server-only; include `/api/v1` or let the BFF append it | Yes | `https://<nestjs-service>.onrender.com/api/v1` |

> Both Vercel projects must set `API_INTERNAL_URL` to the public NestJS Render Web Service URL. If it is omitted, the BFF falls back to localhost and production login/dashboard API requests will fail. Keep this variable server-only.
>
> ⚠️ **Never commit `.env` files containing real credentials.** Use `.env.example` with placeholder values only.

---

## Database Setup

### 1. Generate Prisma Client

```bash
pnpm db:generate
```

### 2. Run Migrations

**Development:**
```bash
pnpm db:migrate
```

**Production:**
```bash
pnpm db:migrate:deploy
```

> ⚠️ Never run migrations against the production/main database from a local development machine. Use CI/CD or a dedicated deployment pipeline.

### 3. Seed (Development Only)

```bash
NODE_ENV=development \
ALLOW_DEV_SEED=true \
DATABASE_URL_SEED=<separate-dev-database-url> \
pnpm db:seed
```

The seed script refuses to run in production and requires a separate `DATABASE_URL_SEED` that differs from `DATABASE_URL`.

---

## Local Development

### Start All Services

```bash
# Terminal 1: API
pnpm --filter @trifusion/api start:dev

# Terminal 2: Web Dashboard
pnpm --filter @trifusion/web dev

# Terminal 3: Platform Admin
pnpm --filter @trifusion/platform-admin dev

# Terminal 4: AI Django (optional)
cd services/ai-django
python manage.py runserver 0.0.0.0:8000
```

### Local URLs

| Service | URL |
|---------|-----|
| Customer Web | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| GraphQL | http://localhost:3001/graphql |
| Platform Admin | http://localhost:3002 |
| AI Django | http://localhost:8000 |

---

## Docker Deployment

### Build Images

Multi-stage Dockerfiles are provided for each service:

```bash
# Build API image
docker build -t trifusion-api -f apps/api/Dockerfile .

# Build Web image
docker build -t trifusion-web -f apps/web/Dockerfile .

# Build Platform Admin image
docker build -t trifusion-platform-admin -f apps/platform-admin/Dockerfile .

# Build Django AI image
docker build -t trifusion-django -f services/ai-django/Dockerfile .
```

### Docker Compose

Create a `docker-compose.yml` in the repository root:

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - DIRECT_URL=${DIRECT_URL}
      - AUTH_SECRET=${AUTH_SECRET}
      - NODE_ENV=production
      - CORS_ORIGINS=${CORS_ORIGINS}
      - REDIS_URL=redis://redis:6379
      - AI_SERVICE_URL=http://django:8000
      - AI_SERVICE_SHARED_SECRET=${AI_SERVICE_SHARED_SECRET}
    depends_on:
      - redis
    networks:
      - trifusion

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - API_INTERNAL_URL=http://api:3001/api/v1
    depends_on:
      - api
    networks:
      - trifusion

  platform-admin:
    build:
      context: .
      dockerfile: apps/platform-admin/Dockerfile
    ports:
      - "3002:3002"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - API_INTERNAL_URL=http://api:3001/api/v1
    depends_on:
      - api
    networks:
      - trifusion

  django:
    build:
      context: ./services/ai-django
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - AI_SERVICE_SHARED_SECRET=${AI_SERVICE_SHARED_SECRET}
    depends_on:
      - redis
    networks:
      - trifusion

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - trifusion

networks:
  trifusion:
    driver: bridge
```

Run with:

```bash
docker-compose up -d
```

---

## Kubernetes Deployment

### Namespace and ConfigMap

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: trifusion

---

apiVersion: v1
kind: ConfigMap
metadata:
  name: trifusion-config
  namespace: trifusion
data:
  NODE_ENV: "production"
  DATABASE_URL: ${DATABASE_URL}
  DIRECT_URL: ${DIRECT_URL}
  AUTH_SECRET: ${AUTH_SECRET}
  API_INTERNAL_URL: "http://api-service:3001/api/v1"
  NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
  REDIS_URL: "redis://redis-service:6379"
  AI_SERVICE_URL: "http://django-service:8000"
  AI_SERVICE_SHARED_SECRET: ${AI_SERVICE_SHARED_SECRET}
```

### API Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: trifusion
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: trifusion-api:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: trifusion-config
        - secretRef:
            name: trifusion-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Web Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
  namespace: trifusion
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: trifusion-web:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: trifusion-config
        - secretRef:
            name: trifusion-secrets
```

### Services and Ingress

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
  namespace: trifusion
spec:
  selector:
    app: api
  ports:
  - port: 3001
    targetPort: 3001

---

apiVersion: v1
kind: Service
metadata:
  name: web-service
  namespace: trifusion
spec:
  selector:
    app: web
  ports:
  - port: 3000
    targetPort: 3000

---

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: trifusion-ingress
  namespace: trifusion
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.trifusion.ai
    - app.trifusion.ai
    - admin.trifusion.ai
    secretName: trifusion-tls
  rules:
  - host: api.trifusion.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 3001
  - host: app.trifusion.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 3000
  - host: admin.trifusion.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-service
            port:
              number: 3002
```

Apply with:

```bash
kubectl apply -f k8s/
```

---

## CI/CD Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)

The repository includes a CI workflow that:

1. **Lint** — Runs ESLint across all workspaces
2. **Typecheck** — Runs TypeScript type checking across all packages
3. **Build** — Runs `turbo run build` for production verification
4. **Test** — Runs Jest unit tests (integration tests require `DATABASE_URL_TEST`)

### Required CI Secrets

| Secret | Description |
|--------|-------------|
| `DATABASE_URL_TEST` | Isolated test database URL (pooled) |
| `DIRECT_URL_TEST` | Isolated test database URL (direct) |
| `DOCKERHUB_USERNAME` | Docker Hub username for image publishing |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `SLACK_WEBHOOK` | Slack webhook for deployment notifications |

### Release Process

1. Create a release branch from `main`
2. Update version in `package.json` files
3. Run `pnpm build` and `pnpm typecheck`
4. Run `pnpm test` (unit tests only in CI)
5. Create a GitHub release with changelog
6. Deploy to staging, then production

---

## Health Checks

| Service | Endpoint | Method | Expected Response |
|---------|----------|--------|-------------------|
| API | `/health` | GET | `{"status": "ok", ...}` |
| API | `/ready` | GET | `{"status": "ready", ...}` |
| Web | `/api/health` | GET | `200 OK` |
| Platform Admin | `/api/health` | GET | `200 OK` |
| Django | `/health/` | GET | `200 OK` |

---

## Security Checklist

- [ ] `.env` files are not committed to version control
- [ ] `AUTH_SECRET` is 32+ characters in production
- [ ] `CORS_ORIGINS` only contains trusted domains
- [ ] Database URLs point to non-production branches in staging
- [ ] SSL/TLS is enforced at the load balancer level
- [ ] HttpOnly, Secure, SameSite=strict cookies are configured
- [ ] Secrets are stored in a secret manager (not in plain text)
- [ ] Audit logs are enabled and append-only
- [ ] Redis is not exposed to the public internet
- [ ] S3 bucket has private access with signed URLs

---

## Monitoring & Observability

| Tool | Purpose | Endpoint |
|------|---------|----------|
| Prometheus | Metrics collection | `:9090` |
| Grafana | Dashboards | `:3000` |
| Sentry | Error tracking | Configured in API |
| Loki | Log aggregation | `:3100` |

Structured logs with correlation IDs (`X-Request-Id`) are emitted in JSON format for all API requests.

---

## Rollback Procedure

1. Identify the last known-good Docker image tag
2. Update the deployment manifest to use the previous image
3. Apply the change: `kubectl apply -f k8s/`
4. Verify health checks pass
5. If issues persist, scale down to 0 replicas and investigate

---

## Support

For deployment issues, see:
- `docs/RUNBOOK.md` — Operational procedures
- `docs/INCIDENT_RESPONSE.md` — Incident response guide
- `docs/STATUS_REPORT.md` — Current implementation status
