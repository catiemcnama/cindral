---
name: Database Setup & Usage
description: Instructions for setting up and working with the PostgreSQL database using Drizzle ORM
applyTo: "**/*.{ts,tsx}"
---

# Database Setup & Usage

This document contains instructions for setting up and working with the database.

## Prerequisites

- Docker and Docker Compose installed
- Node.js (or Bun) installed

## Getting Started

### 1. Start the PostgreSQL Database

```bash
docker-compose up -d
```

This will start a PostgreSQL 17 container with:
- Database: `cindral`
- User: `postgres`
- Password: `postgres`
- Port: `5432`

### 2. Push the Schema to the Database

For rapid development without migration files:

```bash
npm run db:push
```

Or generate and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 3. Open Drizzle Studio (Optional)

To visually browse and edit your database:

```bash
npm run db:studio
```

This will open a browser-based database GUI at `https://local.drizzle.studio`

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate SQL migration files from schema changes |
| `npm run db:migrate` | Apply pending migrations to the database |
| `npm run db:push` | Push schema changes directly (no migration files) |
| `npm run db:studio` | Open Drizzle Studio database browser |

## Development Workflow

### When to use `db:push` vs `db:migrate`

**Use `db:push` when:**
- Rapidly prototyping
- Working on local development
- You don't need a migration history

**Use `db:generate` + `db:migrate` when:**
- Working on production schema changes
- You need a migration history
- Collaborating with a team
- Deploying to production

### Making Schema Changes

1. Edit the schema in [src/db/schema.ts](src/db/schema.ts)
2. Push changes: `npm run db:push`
   - Or generate migration: `npm run db:generate`
   - Then apply: `npm run db:migrate`

## Database Connection

The database URL is configured in `.env.local`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cindral
```

## Schema Overview

Current tables:
- **users**: User accounts with name, email, and timestamps
- **posts**: Blog posts or content with user relationships

Check [src/db/schema.ts](src/db/schema.ts) for the full schema definition.

## Using the Database in tRPC

The database is available in tRPC context as `ctx.db`. Example:

```typescript
// Get all users
const users = await opts.ctx.db.select().from(users);

// Create a user
const [newUser] = await opts.ctx.db
  .insert(users)
  .values({ name: 'John', email: 'john@example.com' })
  .returning();
```

## Stopping the Database

```bash
docker-compose down
```

To remove the volume (delete all data):

```bash
docker-compose down -v
```

## Troubleshooting

### Connection refused
- Make sure Docker is running
- Check if the container is running: `docker ps`
- Start the container: `docker-compose up -d`

### Port already in use
- Another PostgreSQL instance might be running on port 5432
- Stop the other instance or change the port in `docker-compose.yml`

### Schema changes not applying
- Try `npm run db:push` to push schema changes directly
- Check Drizzle Studio to verify the schema
