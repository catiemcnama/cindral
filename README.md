# Cindral Web

A modern full-stack web application built with Next.js, featuring type-safe APIs, a robust database layer, and a comprehensive UI component library.

## Tech Stack

### Core Framework
- **[Next.js 16](https://nextjs.org)** - React framework with App Router
- **[React 19](https://react.dev)** - UI library
- **[TypeScript](https://www.typescriptlang.org)** - Type safety

### API & Data Fetching
- **[tRPC v11](https://trpc.io)** - End-to-end type-safe APIs
- **[TanStack Query v5](https://tanstack.com/query)** - Async state management
- **[Zod](https://zod.dev)** - Schema validation
- **[SuperJSON](https://github.com/blitz-js/superjson)** - JSON serialization with Date, Map, Set support

### Database
- **[Drizzle ORM](https://orm.drizzle.team)** - TypeScript ORM
- **[PostgreSQL 17](https://www.postgresql.org)** - Database
- **[postgres.js](https://github.com/porsager/postgres)** - PostgreSQL client

### UI & Styling
- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first CSS
- **[Radix UI](https://www.radix-ui.com)** - Headless UI primitives
- **[Lucide React](https://lucide.dev)** - Icon library
- **Custom component library** - Pre-built, accessible components

### Development Tools
- **[Bun](https://bun.sh)** - Fast JavaScript runtime & package manager
- **[Docker](https://www.docker.com)** - Containerization for local PostgreSQL
- **[Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)** - Database GUI
- **[ESLint](https://eslint.org)** - Code linting
- **[Prettier](https://prettier.io)** - Code formatting

## Quick Start

### Prerequisites
- **Bun** (or Node.js 18+)
- **Docker** and **Docker Compose**
- **Git**

### 1. Clone and Install

```bash
git clone <repository-url>
cd cindral-web
bun install
```

### 2. Set Up Environment

```bash
# Copy the example environment file
cp .env.example .env.local

# The default DATABASE_URL should work for local development:
# DATABASE_URL=postgres://postgres:postgres@localhost:5432/cindral
```

### 3. Start the Database

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Push the schema to the database
bun run db:push
```

### 4. Run the Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Local Development Workflow

### Daily Development

```bash
# 1. Make sure the database is running
docker-compose up -d

# 2. Start the dev server
bun dev

# 3. (Optional) Open Drizzle Studio to view/edit data
bun run db:studio
```

### Making Database Changes

```bash
# 1. Edit your schema in src/db/schema.ts

# 2. For rapid local development (no migration files):
bun run db:push

# OR for production-ready migrations:
bun run db:generate  # Generate migration file
bun run db:migrate   # Apply migrations
```

### Code Quality

```bash
# Type checking
bun run type-check

# Linting
bun run lint

# Formatting
bun run format
```

## Project Structure

```
cindral-web/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/trpc/     # tRPC API endpoint
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/ui/    # Reusable UI components
│   ├── db/               # Database layer
│   │   ├── schema.ts     # Drizzle schema definitions
│   │   └── index.ts      # Database client
│   ├── trpc/             # tRPC configuration
│   │   ├── init.ts       # tRPC initialization & context
│   │   ├── client.tsx    # Client-side tRPC setup
│   │   ├── server.tsx    # Server-side tRPC helpers
│   │   └── routers/      # API route definitions
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility functions
├── .github/
│   └── instructions/     # AI coding guidelines
├── drizzle/              # Database migrations
├── public/               # Static assets
├── docker-compose.yml    # PostgreSQL container config
├── drizzle.config.ts     # Drizzle ORM config
└── package.json          # Dependencies & scripts
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server |
| `bun build` | Build for production |
| `bun start` | Start production server |
| `bun run type-check` | Run TypeScript type checking |
| `bun run lint` | Run ESLint |
| `bun run format` | Format code with Prettier |
| `bun run db:generate` | Generate database migrations |
| `bun run db:migrate` | Apply database migrations |
| `bun run db:push` | Push schema changes (dev) |
| `bun run db:studio` | Open Drizzle Studio |

## Key Features & Patterns

### Type-Safe API with tRPC
- Define procedures in `src/trpc/routers/`
- Automatic TypeScript types from backend to frontend
- See [tRPC guidelines](.github/instructions/trpc-tsx-guidelines.instructions.md) for usage patterns

### Database Access
- Drizzle ORM for type-safe database queries
- Database available in tRPC context as `ctx.db`
- See [database instructions](.github/instructions/database.instructions.md) for details

### UI Components
- Pre-built components in `src/components/ui/`
- Based on Radix UI primitives
- Styled with Tailwind CSS
- Fully accessible (ARIA compliant)

## Learn More

- **[Database Setup & Usage](.github/instructions/database.instructions.md)** - Complete database guide
- **[tRPC Usage Guidelines](.github/instructions/trpc-tsx-guidelines.instructions.md)** - How to use tRPC correctly
- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
