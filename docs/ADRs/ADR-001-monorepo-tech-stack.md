# ADR-001: Monorepo Architecture & Tech Stack Selection

## Status
Accepted

## Date
2026-10-15

## Context
TriFusion AI requires a frontend web application, an internal platform admin console, a robust backend API for business logic and tenancy enforcement, and shared libraries for validation schemas and API contracts. We needed a cohesive project structure that minimizes duplication, enforces type safety from database to UI, and maintains clean operational boundaries.

## Decision
1. **Repository Structure**: Use a pnpm workspace monorepo managed with Turborepo (`apps/web`, `apps/api`, `apps/admin`, `packages/contracts`, `packages/ui`, `packages/utils`, `database/prisma`).
2. **Backend**: NestJS with TypeScript, providing modular architecture, dependency injection, and integrated OpenAPI/Swagger generation.
3. **Frontend**: Next.js 14+ with React, App Router, Tailwind CSS, and shadcn/ui components.
4. **Data Layer**: PostgreSQL with Prisma ORM for type-safe schema definitions and declarative migrations.

## Consequences
- **Positive**: Single language (TypeScript) across the entire stack, shared schemas and types, fast monorepo builds with Turborepo caching, clear separation of concerns.
- **Negative**: Monorepo tooling setup overhead; dependency management across workspaces requires care with versions.

