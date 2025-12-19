# Cindral Web

A modern full-stack web application built with Next.js, featuring type-safe APIs, a robust database layer, comprehensive authentication with organizations, and a complete UI component library.

## Tech Stack

### Core Framework

- **[Next.js 16](https://nextjs.org)** - React framework with App Router
- **[React 19](https://react.dev)** - UI library
- **[TypeScript](https://www.typescriptlang.org)** - Type safety

### Authentication & Authorization

- **[Better Auth](https://better-auth.com)** - Modern auth library with organization support
- **Email/Password** - Secure credential authentication
- **Multi-tenant Organizations** - Full organization/team management
- **Role-Based Access Control** - Owner, admin, and member roles
- **Session Management** - Secure, server-side sessions

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

## Features

✨ **Authentication & Organizations**

- Email/password authentication
- Multi-tenant organization support
- Role-based access control (RBAC)
- Member invitations and management
- Active organization context

🔐 **Secure & Type-Safe**

- End-to-end type safety from database to UI
- Protected tRPC procedures
- Organization-scoped queries
- Server-side session validation

🎨 **Modern UI**

- 50+ pre-built components
- Dark mode support
- Fully accessible (WCAG compliant)
- Responsive design

📊 **Database First**

- Type-safe schema with Drizzle
- Relational queries
- Migrations support
- Database studio for visual editing

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

# Add required environment variables to .env.local:
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cindral
BETTER_AUTH_SECRET=<generate-a-random-secret>
BETTER_AUTH_URL=http://localhost:3000
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

### 3. Start the Database

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# Push the schema to the database
bun run db:push
```

### 5. Test Authentication (Optional)

Visit [http://localhost:3000/auth-test](http://localhost:3000/auth-test) to test:

- User sign up/sign in
- Organization creation
- Organization management
- Member roles

## Authentication & Organizations

This project includes a full authentication system with multi-tenant organization support using **Better Auth**.

### Key Features

- **Email/Password Authentication** - Secure credential-based auth
- **Organizations** - Multi-tenant support with roles
- **Member Management** - Invite, remove, and manage members
- **Role-Based Access** - Owner, admin, and member roles
- **Active Organization Context** - Track the user's current organization

### Quick Usage

**Client Component:**

```tsx
'use client'

import { useSession, signIn, signOut } from '@/lib/auth-client'
import { useActiveOrganization } from '@/lib/auth-client'

export function MyComponent() {
  const { data: session } = useSession()
  const { data: activeOrg } = useActiveOrganization()

  if (!session) {
    return <button onClick={() => signIn.email({ email, password })}>Sign In</button>
  }

  return <div>Welcome {session.user.name}!</div>
}
```

**Server Component:**

```tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/sign-in')

  return <div>Hello {session.user.name}</div>
}
```

**tRPC Procedures:**

```typescript
import { protectedProcedure, orgProcedure } from '@/trpc/init'

// Requires authentication
export const myRouter = router({
  getProfile: protectedProcedure.query(({ ctx }) => {
    return ctx.user // user is guaranteed to exist
  }),

  // Requires authentication + active organization
  getOrgData: orgProcedure.query(({ ctx }) => {
    const orgId = ctx.activeOrganizationId
    const role = ctx.member.role // owner, admin, or member
    // ...
  }),
})
```

**For complete documentation**, see [`.github/instructions/auth.instructions.md`](.github/instructions/auth.instructions.md)

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
│   │   ├── api/
│   │   │   ├── auth/     # Better Auth API routes
│   │   │   └── trpc/     # tRPC API endpoint
│   │   ├── auth-test/    # Auth demo page
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── auth-demo.tsx # Auth UI demo
│   │   └── organization-demo.tsx # Org UI demo
│   ├── db/               # Database layer
│   │   ├── schema.ts     # Drizzle schema (auth + app tables)
│   │   └── index.ts      # Database client
│   ├── lib/              # Utility functions
│   │   ├── auth.ts       # Better Auth server config
│   │   ├── auth-client.ts # Better Auth client hooks
│   │   └── utils.ts      # Helpers
│   ├── trpc/             # tRPC configuration
│   │   ├── init.ts       # Context with auth session
│   │   ├── client.tsx    # Client-side tRPC setup
│   │   ├── server.tsx    # Server-side tRPC helpers
│   │   └── routers/      # API route definitions
│   └── hooks/            # Custom React hooks
├── .github/
│   └── instructions/     # AI coding guidelines
│       ├── database.instructions.md
│       ├── trpc-tsx-guidelines.instructions.md
│       └── auth.instructions.md
├── drizzle/              # Database migrations
├── public/               # Static assets
├── docker-compose.yml    # PostgreSQL container config
├── drizzle.config.ts     # Drizzle ORM config
└── package.json          # Dependencies & scripts
```

## Available Scripts

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `bun dev`             | Start development server     |
| `bun build`           | Build for production         |
| `bun start`           | Start production server      |
| `bun run type-check`  | Run TypeScript type checking |
| `bun run lint`        | Run ESLint                   |
| `bun run format`      | Format code with Prettier    |
| `bun run db:generate` | Generate database migrations |
| `bun run db:migrate`  | Apply database migrations    |
| `bun run db:push`     | Push schema changes (dev)    |
| `bun run db:studio`   | Open Drizzle Studio          |

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
