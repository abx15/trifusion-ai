# TriFusion AI — Deployment Guide

## Overview

TriFusion AI is a monorepo with three deployable applications:
- **NestJS API** (`apps/api`) — REST + GraphQL backend on port 3001
- **Next.js Web** (`apps/web`) — Customer dashboard on port 3000
- **Next.js Platform Admin** (`apps/platform-admin`) — Staff dashboard on port 3002
- **Django AI** (`services/ai-django`) — AI backend on port 8000

## Prerequisites

- Node.js v24+
- pnpm 8+
- Python 3.12+ (for AI service)
- Neon PostgreSQL (production database)
- Redis (for BullMQ job queues)

## Environment Variables

### Required (all apps)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://...` |
| `DIRECT_URL` | Direct Neon connection (migrations) | `postgresql://...` |
| `NEXTAUTH_SECRET` | Session signing secret | `32+ random chars` |
| `JWT_SECRET` | JWT signing secret | `32+ random chars` |
| `API_INTERNAL_URL` | Internal API base URL | `http://api:3001/api/v1` |
| `NEXT_PUBLIC_API_URL` | Public API URL for browser | `https://api.trifusion.ai` |
| `AI_SERVICE_URL` | Django AI backend URL | `http://django:8000` |
| `AI_SERVICE_SHARED_SECRET` | HMAC secret for service tokens | `32+ random chars` |
| `REDIS_URL` | Redis connection for BullMQ | `redis://redis:6379` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | API server port | `3001` |
| `STRIPE_SECRET_KEY` | Stripe API key | — |
| `SENDGRID_API_KEY` | Email service key | — |
| `AWS_S3_BUCKET` | File storage bucket | — |

## Database Setup

```bash
# Generate Prisma client
pnpm --filter @trifusion/api exec prisma generate

# Run migrations against production database
pnpm --filter @trifusion/api exec prisma migrate deploy

# Seed (only in non-production)
pnpm --filter @trifusion/api exec prisma db seed
```

## Install Dependencies

```bash
pnpm install
```

## Build

```bash
# Build all workspaces
pnpm build

# Or build individually
pnpm --filter @trifusion/api build
pnpm --filter @trifusion/web build
pnpm --filter @trifusion/platform-admin build
```

## Run (Development)

```bash
# Run all apps in parallel
pnpm dev

# Or individually
pnpm --filter @trifusion/api dev      # Port 3001
pnpm --filter @trifusion/web dev       # Port 3000
pnpm --filter @trifusion/platform-admin dev  # Port 3002
```

## Run (Production)

Build first, then start:

```bash
pnpm build
pnpm start:prod
```

## Docker

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

## Health Checks

- API: `GET /health` and `GET /ready` (port 3001)
- Web: `GET /api/health` (port 3000)
- Platform Admin: `GET /api/health` (port 3002)
- Django: `GET /health/` (port 8000)

## Security

- Never commit `.env` files containing real credentials
- Use `.env.example` with placeholder values
- Rotate secrets regularly (see SECRET_ROTATION.md)
- All API cookies are HttpOnly, Secure, SameSite=strict

## Support

For deployment issues, see RUNBOOK.md and INCIDENT_RESPONSE.md.
