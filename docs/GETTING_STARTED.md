# Getting Started with Cindral

## Prerequisites

- Node.js 18+ (or Bun)
- PostgreSQL 15+ running
- `.env.local` configured with `DATABASE_URL`
- Anthropic API key (optional, for AI features)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Push schema to database
npm run db:push

# 3. Seed the database with demo data
npm run db:seed

# 4. Run unit tests to verify setup
npm run test:unit

# 5. Start the development server
npm run dev
```

## Database Setup

### Using Docker

```bash
# Start PostgreSQL
docker-compose up -d

# Create .env.local
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cindral" > .env.local
```

### Manual Setup

1. Create a PostgreSQL database named `cindral`
2. Add the connection string to `.env.local`:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/cindral
   ```

## Demo Data

The seed script creates:

| Entity         | Count per Org                                  |
| -------------- | ---------------------------------------------- |
| Organizations  | 2 (FinBank EU, PayTech UK)                     |
| Users          | 4 per org (Admin, Compliance, Auditor, Viewer) |
| Regulations    | 2 (DORA, GDPR)                                 |
| Articles       | ~14                                            |
| Obligations    | ~28                                            |
| Systems        | 4                                              |
| Alerts         | 4                                              |
| Evidence Packs | 3                                              |

### Demo Login Credentials

| Email                          | Organization | Role              |
| ------------------------------ | ------------ | ----------------- |
| admin+finbank@cindral.dev      | FinBank EU   | OrgAdmin          |
| compliance+finbank@cindral.dev | FinBank EU   | ComplianceManager |
| auditor+finbank@cindral.dev    | FinBank EU   | Auditor           |
| viewer+finbank@cindral.dev     | FinBank EU   | Viewer            |

## Verify Setup

### 1. Health Check

```bash
curl http://localhost:3000/api/health/db
```

Returns database connectivity, migration status, and entity counts.

### 2. Run Tests

```bash
npm run test:unit
```

Runs:

- RBAC tests (role-based access control)
- Tenant isolation tests (org A cannot see org B data)
- Audit log tests (mutations are logged)
- Ingest pipeline tests (provenance tracking)

### 3. Open Drizzle Studio

```bash
npm run db:studio
```

Browse your database at `https://local.drizzle.studio`

## Regulatory Ingest

Ingest real regulations from EUR-Lex:

```bash
# Ingest DORA regulation
npm run ingest -- dora

# Ingest GDPR
npm run ingest -- gdpr

# Ingest all available regulations
npm run ingest -- --all

# List available regulations
npm run ingest -- --list
```

## Environment Variables

Required:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/cindral
BETTER_AUTH_SECRET=<32+ character random string>
BETTER_AUTH_URL=http://localhost:3000
```

Optional:

```bash
ANTHROPIC_API_KEY=<for AI summaries>
```

## Architecture Overview

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Auth pages (signin, signup)
│   ├── (marketing)/        # Public marketing pages
│   ├── dashboard/          # Protected dashboard pages
│   └── api/                # API routes (tRPC, health, auth)
├── components/             # React components
│   ├── ui/                 # Base UI components (shadcn/ui)
│   └── marketing/          # Marketing-specific components
├── db/                     # Database (Drizzle ORM)
│   ├── schema.ts           # Table definitions
│   └── seed.ts             # Demo data seeding
├── lib/                    # Shared utilities
│   ├── auth.ts             # Better Auth configuration
│   ├── tenancy.ts          # Multi-tenant utilities & RBAC
│   └── audit.ts            # Audit logging
├── trpc/                   # tRPC API layer
│   ├── routers/            # Domain-specific routers
│   └── init.ts             # tRPC initialization
└── tests/                  # Unit tests
```

## Role Permissions

| Role              | Can Read | Can Mutate | Can Delete Regulations | Can Manage Billing |
| ----------------- | -------- | ---------- | ---------------------- | ------------------ |
| OrgAdmin          | ✅       | ✅         | ✅                     | ✅                 |
| ComplianceManager | ✅       | ✅         | ❌                     | ❌                 |
| Auditor           | ✅       | ❌         | ❌                     | ❌                 |
| Viewer            | ✅       | ❌         | ❌                     | ❌                 |
| BillingAdmin      | ✅       | ❌         | ❌                     | ✅                 |

## Status Workflows

### Obligation Status

```
not_started → in_progress → implemented → under_review → verified
```

### Alert Status

```
open → in_triage → in_progress → resolved
                              └→ wont_fix
```

### Evidence Pack Status

```
draft → generating → ready
                  └→ failed
                  └→ archived
```

## Troubleshooting

### Tests fail with "No obligations found"

Run `npm run db:seed` first.

### Ingest fails with Claude error

Ensure `ANTHROPIC_API_KEY` is set in `.env.local`.

### Database connection fails

1. Ensure PostgreSQL is running
2. Verify `DATABASE_URL` in `.env.local`
3. Check network connectivity

### Migration errors

```bash
npm run db:push  # Sync schema to database
```

## Next Steps

See [ROADMAP.md](../ROADMAP.md) for the complete development plan.
