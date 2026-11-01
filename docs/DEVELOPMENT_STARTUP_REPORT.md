# Development Startup Report

**Date:** 2026-11-01

## Root command

```powershell
pnpm dev
```

## Verified services

| Service | Port | Result |
|---|---:|---|
| Customer web | 3000 | PASS |
| NestJS API | 3001 | PASS |
| Platform admin | 3002 | PASS |
| Django AI service | 3003 | PASS |

Turbo already includes `services/*`; the missing NestJS `dev` script was added to `apps/api/package.json`. Root output keeps package names visible and does not suppress startup failures.

## Known environment distinction

The local package script uses Django port 3003. Docker compose publishes Django on port 8000 for its container network. These are separate execution modes and must not be mixed.

