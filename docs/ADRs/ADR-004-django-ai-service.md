# ADR-004: Django REST Framework for AI Service

## Status
Accepted

## Date
2026-10-15

## Context
TriFusion AI requires specialized AI orchestration and document processing capabilities. The core business rules and multi-tenant persistence are owned by NestJS (`apps/api`). We needed a Python-based service for future heavy scientific, document manipulation, and LLM orchestration workloads while maintaining full observability and request tracing across services.

## Decision
Establish `services/ai-django` using Django and Django REST Framework:
1. NestJS (`apps/api`) remains the single authoritative owner of all business logic, tenancy checks, and user database models.
2. `services/ai-django` operates as an internal auxiliary microservice called only by authenticated server-to-server requests.
3. Both services implement an identical `X-Request-Id` correlation ID convention, structured JSON logging, and uniform `/health` and `/ready` endpoints.
4. Python package quality is enforced via `ruff` and `pytest`.

## Consequences
- **Positive**: Direct access to rich Python AI/ML ecosystem, unified correlation ID tracing across Node and Python stacks, robust testing and formatting tooling.
- **Negative**: Monorepo supports both Node.js and Python runtimes in CI.

