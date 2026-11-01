# API Integration Report

**Date:** 2026-11-01

## Request flow

`Browser -> Next.js same-origin proxy -> NestJS -> Prisma/PostgreSQL`

AI requests additionally use:

`NestJS -> signed service token -> Django AI service`

## Verified

| Integration | Result |
|---|---|
| Web login proxy to NestJS | PASS |
| Platform login proxy to NestJS | PASS |
| Workspace validation and dashboard GraphQL | PASS |
| NestJS typecheck and build | PASS |
| Django health/readiness endpoints | PASS |
| Django service-token route contract tests | PARTIAL |
| Browser-to-Django direct access | BLOCKED BY DESIGN |
| NestJS SSE stream proxy | PARTIAL — current endpoint returns stream metadata rather than forwarding an SSE body |

