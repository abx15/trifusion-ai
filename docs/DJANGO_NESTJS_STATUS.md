# Django and NestJS Status

**Date:** 2026-11-01

## Django

- `manage.py check`: PASS
- Django tests: PASS (10 passed)
- Local development port: 3003
- Health: `GET /health`
- Readiness: `GET /ready`
- AI routes require a signed service token.
- PostgreSQL connection strings now support both `DATABASE_URL` and `DJANGO_DATABASE_URL`.
- `dj-database-url` was added to `requirements.txt`, matching the import in settings.

## NestJS

- Typecheck: PASS
- Build: PASS
- Local development port: 3001
- JWT, workspace, platform, and AI policy guards are present.
- AI streaming remains PARTIAL because the current controller returns a stream URL/metadata instead of proxying Django's SSE response.

