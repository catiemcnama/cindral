Day 1 Demo — Runbook

Prereqs:
- PostgreSQL running and DATABASE_URL set in .env.local
- Node toolchain installed (bun/tsx/npm)

Steps:

1. Run migrations (ensure drizzle configured):

```bash
npm run db:migrate
```

2. Seed DB:

```bash
npm run db:seed
```

This writes `scripts/seed-snapshot.md` with quick credentials and org list.

3. Run ingest demos (creates ingest_jobs with provenance):

```bash
npm run ingest:demo:finbank
npm run ingest:demo:paytech
```

4. Check DB health endpoint (internal):

Open in browser:

GET /api/health/db

5. Run Day 1 tests:

```bash
npm run test:day1
```

Notes:
- Seed creates two orgs: FinBank EU (finbank-eu) and PayTech UK (paytech-uk).
- Example admin logins are in `scripts/seed-snapshot.md`.
- Audit rows are written by `recordAudit()`; the audit table is `audit_log`.
