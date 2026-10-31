# TriFusion AI — Runbook

## Common Issues

### API won't start

**Symptoms:** `apps/api` crashes on startup, database connection errors.

**Checks:**
1. Verify `DATABASE_URL` is set and points to a reachable Neon instance
2. Verify `DIRECT_URL` is set for Prisma migrations
3. Run `pnpm --filter @trifusion/api typecheck` to check for TypeScript errors
4. Check Neon dashboard for instance status (pause/resume)

**Fix:**
```bash
pnpm --filter @trifusion/api exec prisma generate
pnpm --filter @trifusion/api exec prisma migrate deploy
pnpm --filter @trifusion/api start:dev
```

### Frontend can't fetch data (401 errors)

**Symptoms:** Dashboard shows loading indefinitely or API returns 401.

**Checks:**
1. Verify cookie names match between API and proxy (`accessToken`/`refreshToken`)
2. Verify `API_INTERNAL_URL` or `NEXT_PUBLIC_API_URL` is set correctly
3. Check browser DevTools → Application → Cookies for token presence
4. Verify user is authenticated (JWT not expired)

**Fix:** Align cookie names in `apps/web/src/app/api/backend/[...path]/route.ts` and `apps/platform-admin/src/app/api/backend/[...path]/route.ts` with the API's `accessToken`/`refreshToken`.

### WebSocket / Realtime not working

**Symptoms:** Live updates not appearing, SSE connections dropping.

**Checks:**
1. Verify `REDIS_URL` is set and Redis is reachable
2. Verify BullMQ workers are running
3. Check API logs for queue connection errors

### Django AI service errors

**Symptoms:** AI endpoints return 502 Bad Gateway.

**Checks:**
1. Verify `AI_SERVICE_URL` is reachable from the API container
2. Verify `AI_SERVICE_SHARED_SECRET` matches between API and Django
3. Check Django logs at `services/ai-django/`
4. Verify Django is running on port 8000

## Incident Response

1. **Identify** — Check health endpoints (`/health`, `/ready`)
2. **Mitigate** — Rollback deployment if needed (see RELEASE_CHECKLIST.md)
3. **Investigate** — Check application logs and database metrics
4. **Resolve** — Apply fix and redeploy
5. **Communicate** — Notify stakeholders of resolution

## Escalation Contacts

- Platform Infra: See SECURITY.md
- Database (Neon): Neon console dashboard
- AI Service: Django logs at `services/ai-django/logs/`
