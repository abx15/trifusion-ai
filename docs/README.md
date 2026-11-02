# TriFusion AI Documentation

> **Welcome to the TriFusion AI documentation hub.** This directory contains comprehensive documentation for developers, operators, and users.

---

## Quick Start

1. **New to TriFusion AI?** Start with the [Main README](../README.md)
2. **Setting up locally?** See [Development Setup](#development-setup)
3. **Deploying to production?** See [Deployment Guide](DEPLOYMENT.md)
4. **Test credentials?** See [LOGIN_CREDENTIALS.md](../LOGIN_CREDENTIALS.md)

---

## Documentation Index

### 📚 Getting Started

| Document | Description | Audience |
|----------|-------------|----------|
| [Main README](../README.md) | Project overview, architecture, quick start | Everyone |
| [Implementation Summary](IMPLEMENTATION_SUMMARY.md) | Complete implementation timeline and achievements | Everyone |
| [Development Roadmap](DEVELOPMENT_ROADMAP.md) | Phase status and future enhancements | Developers |

### 🏗️ Architecture & Design

| Document | Description | Audience |
|----------|-------------|----------|
| [System Architecture](SYSTEM_ARCHITECTURE.md) | High-level architecture, diagrams, technology stack | Architects, Developers |
| [Architecture Diagrams](ARCHITECTURE_DIAGRAMS.md) | Mermaid diagrams for system flows | Architects, Developers |
| [Database Design](DATABASE_DESIGN.md) | Prisma schema, ERD, indexing strategy | Backend Developers |
| [Design System](DESIGN_SYSTEM.md) | Material UI theme, components, usage | Frontend Developers |
| [ADRs](ADRs/README.md) | Architecture Decision Records | Architects, Senior Developers |

### 🔐 Security & Authorization

| Document | Description | Audience |
|----------|-------------|----------|
| [Security Guide](SECURITY.md) | Security policies, best practices, configuration | Everyone |
| [Authorization Matrix](AUTHORIZATION_MATRIX.md) | Complete permissions matrix for all 8 roles | Developers, Security |
| [Roles Reference](ROLES_REFERENCE.md) | Role hierarchy, enforcement, code paths | Developers |
| [Authentication & Auth Audit](AUTHENTICATION_AUTHORIZATION_AUDIT.md) | Auth implementation audit | Security, Developers |

### 📖 API & Integration

| Document | Description | Audience |
|----------|-------------|----------|
| [API Contracts](API_CONTRACTS.md) | Complete OpenAPI-style request/response reference | Frontend Developers, Integrators |
| [API Reference](API_REFERENCE.md) | API endpoint documentation | Frontend Developers, Integrators |
| [Analytics & Metrics](ANALYTICS_METRICS.md) | Analytics endpoints and metrics | Developers, Analysts |

### 🎨 User Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [User Guide](USER_GUIDE.md) | Role-specific dashboard walkthroughs | End Users |
| [LOGIN_CREDENTIALS.md](../LOGIN_CREDENTIALS.md) | Test credentials and login examples | Developers, QA |

### 🚀 Deployment & Operations

| Document | Description | Audience |
|----------|-------------|----------|
| [Deployment Guide](DEPLOYMENT.md) | Docker, environment variables, health checks | DevOps, SRE |
| [Runbook](RUNBOOK.md) | Operational procedures and common tasks | Operators, SRE |
| [Incident Response](INCIDENT_RESPONSE.md) | Incident management procedures | SRE, Support |
| [Backup & Restore](BACKUP_RESTORE.md) | Database backup and restore procedures | Operators, SRE |
| [Secret Rotation](SECRET_ROTATION.md) | Secret management and rotation procedures | Security, SRE |
| [Release Checklist](RELEASE_CHECKLIST.md) | Pre-release verification checklist | Release Managers |
| [AI Safety](AI_SAFETY.md) | AI safety guidelines and policies | AI Engineers, Security |

### 🧪 Testing & Quality

| Document | Description | Audience |
|----------|-------------|----------|
| [Known Issues](KNOWN_ISSUES.md) | Known bugs and workarounds | Everyone |
| [Production Readiness](PRODUCTION_READINESS_REPORT.md) | Production readiness assessment | Release Managers |

### 📊 Reports & Audits

| Document | Description | Audience |
|----------|-------------|----------|
| [PRD](PRD.md) | Product Requirements Document | Product Managers, Developers |
| [GAP Analysis](GAP_ANALYSIS.md) | Feature gap analysis | Product Managers |

---

## Architecture Decision Records (ADRs)

ADRs document significant architectural decisions. Each ADR explains:

- **Context**: The problem or opportunity
- **Decision**: The chosen solution
- **Consequences**: Benefits, drawbacks, and alternatives

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](ADRs/ADR-001-monorepo-tech-stack.md) | Monorepo Tech Stack | Accepted |
| [ADR-002](ADRs/ADR-002-identity-and-auth.md) | Identity and Authentication | Accepted |
| [ADR-003](ADRs/ADR-003-platform-admin-separation.md) | Platform Admin Separation | Accepted |
| [ADR-004](ADRs/ADR-004-django-ai-service.md) | Django AI Service | Accepted |
| [ADR-005](ADRs/ADR-005-phase2-tenancy-and-rbac.md) | Phase 2 Tenancy and RBAC | Accepted |
| [ADR-006](ADRs/ADR-006-phase3-domain-and-api.md) | Phase 3 Domain and API | Accepted |
| [ADR-007](ADRs/ADR-007-phase4-frontend-session-and-data.md) | Phase 4 Frontend Session and Data | Accepted |
| [ADR-008](ADRs/ADR-008-ai-service-contract-and-queue-ownership.md) | AI Service Contract and Queue Ownership | Accepted |
| [ADR-009](ADRs/ADR-009-ai-provider-adapter-and-quota-model.md) | AI Provider Adapter and Quota Model | Accepted |
| [ADR-010](ADRs/ADR-010-phase8-privileged-access-model.md) | Phase 8 Privileged Access Model | Accepted |
| [ADR-011](ADRs/ADR-011-phase8-audit-log-integrity.md) | Phase 8 Audit Log Integrity | Accepted |
| [ADR-012](ADRs/ADR-012-phase8-feature-flag-evaluation.md) | Phase 8 Feature Flag Evaluation | Accepted |
| [ADR-013](ADRs/ADR-013-phase8-entitlement-model.md) | Phase 8 Entitlement Model | Accepted |
| [ADR-014](ADRs/ADR-014-phase8-admin-app-structure.md) | Phase 8 Admin App Structure | Accepted |

---

## Development Setup

### Prerequisites

- **Node.js** 18 or newer
- **pnpm** 8 or newer
- **Python** 3.12+ (only for AI service)
- **PostgreSQL** (Neon or local)

### Quick Start

```bash
# Clone repository
git clone https://github.com/abx15/trifusion-ai.git
cd trifusion-ai

# Install dependencies
pnpm install

# Setup environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/platform-admin/.env.example apps/platform-admin/.env

# Database setup
pnpm db:generate
pnpm db:migrate

# Seed test data (development only)
NODE_ENV=development ALLOW_DEV_SEED=true DATABASE_URL_SEED=<separate-db> pnpm db:seed

# Start development servers
pnpm dev
```

### Local URLs

| Service | URL |
|---------|-----|
| Customer Web Dashboard | http://localhost:3000 |
| NestJS API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| Platform Admin Portal | http://localhost:3002 |
| AI Django Service | http://localhost:8000 |

---

## Common Commands

```bash
# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type-check all packages
pnpm typecheck

# Run all tests
pnpm test

# Database operations
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Apply migrations
pnpm db:seed        # Seed test data (dev only)
pnpm db:studio      # Open Prisma Studio

# Run specific package
pnpm --filter @trifusion/api dev
pnpm --filter @trifusion/web dev
pnpm --filter @trifusion/platform-admin dev
```

---

## Troubleshooting

### Build Errors

**Error**: `Type error: Type 'X' does not satisfy the constraint 'Y'`

**Solution**: Run `pnpm typecheck` to identify type errors. Ensure all shared types are properly exported from `packages/contracts`.

### Database Connection

**Error**: `Can't reach database server`

**Solution**:
1. Verify `DATABASE_URL` in `.env` is correct
2. Check PostgreSQL is running
3. Ensure network allows connection

### Authentication Issues

**Error**: `401 Unauthorized` or `403 Forbidden`

**Solution**:
1. Verify user credentials in [LOGIN_CREDENTIALS.md](../LOGIN_CREDENTIALS.md)
2. Check JWT secret is set in `.env`
3. Ensure refresh token cookie is set correctly

### AI Service Not Responding

**Error**: AI endpoints return 503

**Solution**:
1. Ensure Django AI service is running: `cd services/ai-django && python manage.py runserver`
2. Check AI service environment variables
3. Verify API internal URL is correct

---

## Contributing to Documentation

When adding new features or making changes:

1. **Update relevant documentation** in the same PR
2. **Add new ADRs** for significant architectural decisions
3. **Update API contracts** if endpoints change
4. **Update README.md** if user-facing changes are made
5. **Review documentation checklist** before release

---

## Documentation Standards

### Markdown Guidelines

- Use **H1** for document title
- Use **H2** for main sections
- Use **H3** for subsections
- Use tables for structured data
- Use code blocks with language specification
- Use mermaid diagrams for visualizations

### Naming Conventions

- Document names: `KEBAB_CASE.md`
- ADR names: `ADR-XXX-description.md`
- Section headers: Sentence case
- Code examples: Consistent with project style

### Review Process

1. Technical accuracy verification
2. Grammar and spelling check
3. Link validation
4. Peer review for architectural docs
5. Security review for security docs

---

## Support

### Getting Help

- **Documentation**: Check relevant docs first
- **Issues**: Search GitHub Issues for similar problems
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately

### Documentation Issues

Found an error or missing information?

1. Check if the document exists in the index
2. Open a GitHub Issue with `documentation` label
3. Submit a PR with the fix

---

## Additional Resources

### External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Material UI Documentation](https://mui.com/material-ui/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Learning Resources

- [Monorepo Best Practices](https://monorepo.tools)
- [Multi-Tenancy Patterns](https://www.microsoft.com/en-us/architecture/multitenancy)
- [RBAC Design Patterns](https://owasp.org/www-community/Access_Control)
- [API Security Best Practices](https://owasp.org/www-project-api-security)

---

**Last Updated**: 2026-11-02
**Documentation Version**: 1.0.0
