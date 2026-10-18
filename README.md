# TriFusion AI

TriFusion AI is a multi-tenant business workspace for freelancers, agencies, and service teams. The product brings client, project, and task workflows together with workspace membership, role-based access control, audit history, and dashboard views.

> **Development status:** Phases 0-2 are marked complete. Phase 3 (core domain APIs) and Phase 4 (frontend dashboards) are **partial**. Authenticated database-backed acceptance checks are pending an isolated, non-production test database. See [the development roadmap](docs/DEVELOPMENT_ROADMAP.md) for verified milestones and open work.

## What is in the repository

- **Customer web app** - Next.js workspace dashboard for clients, projects, tasks, activity, and workspace settings.
- **NestJS API** - REST endpoints, Swagger/OpenAPI, GraphQL dashboard queries, authentication, workspace authorization, and domain services.
- **Platform admin app** - separate staff sign-in and role-gated audit/user-status screens. Analytics and global settings are explicitly unavailable until the API supports them.
- **Prisma database** - PostgreSQL schema, migrations, and guarded development seeds.
- **Shared packages** - UI components, API contracts, utilities, and shared configuration.
- **AI Django service** - a separate service scaffold; it is not required to run the core dashboard.

REST and GraphQL are served by the NestJS API and use the same domain services and authorization policies. The browser apps use same-origin server-side proxies with app-specific HttpOnly cookies; access and refresh tokens are not stored in browser `localStorage`.

## Technology

- TypeScript, pnpm workspaces, and Turborepo
- Next.js 14, React, Tailwind CSS, TanStack Query, and Recharts
- NestJS, REST/Swagger, GraphQL/Apollo, and Prisma
- PostgreSQL, including Neon-compatible pooled runtime and direct migration connections
- Python/Django for the separate AI service

## Repository layout

```text
apps/
  api/                 NestJS REST and GraphQL API
  web/                 Customer-facing Next.js application
  platform-admin/      Internal platform administration application
services/
  ai-django/           Separate AI service
packages/
  config/              Shared tooling configuration
  contracts/           Shared API types and schemas
  ui/                  Shared UI components
  utils/               Shared utilities
database/
  prisma/              Prisma schema and migrations
  seeds/               Development-only seed command
  docs/                ERD and database notes
docs/
  ADRs/                Architecture decision records
  ...                  Product, architecture, security, API, and roadmap docs
```

## Requirements

- Node.js 18 or newer
- pnpm 8 or newer (the repository pins pnpm 8.15.0)
- PostgreSQL for local API/database work
- Python and `pip` if you plan to run the AI Django service

Redis, object storage, email, payment, and AI provider services are optional for the current dashboard flows; configure them only when working on the features that use them.

## Local setup

### 1. Install dependencies

```sh
git clone https://github.com/abx15/trifusion-ai.git
cd trifusion-ai
pnpm install
```

### 2. Configure environment files

Copy the templates for the apps you intend to run:

```text
.env.example                         -> .env
apps/api/.env.example                -> apps/api/.env
apps/web/.env.example                -> apps/web/.env
apps/platform-admin/.env.example     -> apps/platform-admin/.env
```

Use fake/local values in development and keep real `.env` files out of version control. At minimum:

- Set `AUTH_SECRET` to a new, randomly generated secret in `apps/api/.env`.
- Set database URLs in the root `.env` for Prisma CLI commands and in `apps/api/.env` for the running API. Keep the values pointed at the same **development** database.
- Set `API_INTERNAL_URL` in each Next.js app's environment file to the NestJS API origin and `/api/v1` prefix (for local development, `http://localhost:3001/api/v1`).
- Do not put credentials or secrets in `NEXT_PUBLIC_*` variables.

The root and app-specific `.env.example` files contain placeholder values, not deployable credentials. Do not copy production secrets into this repository.

### 3. Database setup (development only)

For Neon, configure `DATABASE_URL` as the pooled runtime connection and `DIRECT_URL` as the direct, non-pooled connection for the **same non-production branch**. Use conservative pool/timeout parameters; for example, `connection_limit=5`, `pool_timeout=10`, and `connect_timeout=10` on the pooled URL. Neon may pause idle branches, so the first query after inactivity can take longer.

Never run migrations, seeds, resets, or integration tests against the production/main database. The integration-test harness requires both `DATABASE_URL_TEST` (pooled) and `DIRECT_URL_TEST` (direct) for a separate disposable branch/database and refuses to fall back to `DATABASE_URL`.

Generate the Prisma client and apply development migrations only after verifying that the configured URLs target your development database:

```sh
pnpm db:generate
pnpm db:migrate
```

Seeding is optional and restricted to a development-only database. Configure `DATABASE_URL_SEED` to a separate non-production database, set `NODE_ENV=development` and explicitly opt in with `ALLOW_DEV_SEED=true`, then run:

```sh
pnpm db:seed
```

The seed command refuses production and does not fall back to the normal runtime database URL.

### 4. Start the applications

From the repository root, use separate terminals:

```sh
pnpm --filter @trifusion/api start:dev
pnpm --filter @trifusion/web dev
pnpm --filter @trifusion/platform-admin dev
```

The AI service is optional:

```sh
cd services/ai-django
python manage.py runserver 0.0.0.0:3003
```

Local URLs:

| Application | URL |
|---|---|
| Customer web | http://localhost:3000 |
| NestJS API | http://localhost:3001 |
| Swagger/OpenAPI | http://localhost:3001/api/docs |
| GraphQL endpoint | http://localhost:3001/graphql |
| Platform admin | http://localhost:3002 |
| AI Django service (optional) | http://localhost:3003 |

GraphQL Playground and introspection are disabled in production. Production API errors are mapped to safe messages.

## Common commands

| Command | Description |
|---|---|
| `pnpm dev` | Start workspace development tasks |
| `pnpm build` | Build workspace packages and applications |
| `pnpm lint` | Lint workspace packages |
| `pnpm typecheck` | Type-check workspace packages |
| `pnpm test` | Run workspace test scripts |
| `pnpm --filter @trifusion/api exec jest --runInBand --testPathIgnorePatterns='integration.spec.ts'` | Run API unit tests without DB integration suites |
| `pnpm --filter @trifusion/api exec jest --runInBand` | Run API unit and integration suites; requires isolated test database URLs |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Create/apply a development migration |
| `pnpm db:migrate:deploy` | Deploy committed migrations to the explicitly configured database |
| `pnpm db:seed` | Run guarded development seed |
| `pnpm db:studio` | Open Prisma Studio |

Use the isolated test database configuration for integration tests; do not use `pnpm db:reset` against a shared or production database.

## Security and tenancy

- Workspace membership, role checks, and resource scoping are enforced by the API; frontend role gating is only a user-experience aid.
- Browser authentication is handled through same-origin proxy routes and HttpOnly cookies. Keep `API_INTERNAL_URL` server-only.
- Authenticated dashboard/API responses are not publicly cached.
- Do not commit `.env` files, access tokens, database credentials, or provider secrets.
- Use separate development, test, and production databases. Never point test or seed variables at the production branch.
- Review [the security guide](docs/SECURITY.md) before deployment.

## Documentation

- [Product requirements](docs/PRD.md)
- [System architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Database design](docs/DATABASE_DESIGN.md) and [ERD](database/docs/ERD.md)
- [API contracts](docs/API_CONTRACTS.md)
- [Authorization matrix](docs/AUTHORIZATION_MATRIX.md)
- [Security guidance](docs/SECURITY.md)
- [Architecture decision records](docs/ADRs/)
- [Development roadmap and verification status](docs/DEVELOPMENT_ROADMAP.md)

The PRD contains an older phase ordering that differs from the current roadmap and dashboard brief. Reconcile that naming before planning the next phase; the roadmap records the discrepancy. No later phase should be considered complete unless its documented checks have actually passed.

## Contributing

1. Create a feature branch.
2. Make a focused change and update directly related documentation.
3. Run the relevant lint, typecheck, build, and test commands.
4. Never use the production database for development or test validation.
5. Submit a pull request with the checks performed and any remaining gaps.

## License

UNLICENSED - All rights reserved.
