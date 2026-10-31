# TriFusion AI — Backup & Restore

## Database Backups (Neon PostgreSQL)

Neon provides automatic point-in-time recovery. Manual backups can be created via:

```bash
# Create a manual backup branch
pnpm --filter @trifusion/api exec prisma db pull --schema database/prisma/schema.prisma

# Or via Neon CLI/API
# neonctl branches create --project <project-id> --name backup-$(date +%Y%m%d)
```

## Restore Procedure

### From Neon Branch

1. Create a new project from the backup branch in Neon console
2. Update `DATABASE_URL` and `DIRECT_URL` to point to the new branch
3. Run migrations: `pnpm --filter @trifusion/api exec prisma migrate deploy`
4. Verify data integrity: `pnpm --filter @trifusion/api typecheck`
5. Restart API: `pnpm --filter @trifusion/api start:prod`

### Point-in-Time Recovery

Use Neon's PITR to restore to a specific timestamp. Then follow the steps above with the recovered branch connection string.

## RPO / RTO Targets

| Metric | Target |
|--------|--------|
| RPO (Recovery Point Objective) | 5 minutes (Neon continuous backup) |
| RTO (Recovery Time Objective) | 15 minutes |

## Backup Verification

- Quarterly restore drill recommended
- Verify record counts match production after restore
- Test authentication flow after restore
