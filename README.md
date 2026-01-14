# Cindral

A modern regulatory compliance platform that helps financial institutions track regulations, manage obligations, and generate audit-ready evidence packs.

## Overview

Cindral provides comprehensive coverage for major regulatory frameworks including:

- **DORA** - Digital Operational Resilience Act
- **GDPR** - General Data Protection Regulation
- **AI Act** - EU Artificial Intelligence Act
- **Basel III** - Banking supervision framework
- **NIS2** - Network and Information Security Directive
- **MiFID II** - Markets in Financial Instruments Directive

## Tech Stack

### Core

- **[Next.js 16](https://nextjs.org)** - React framework with App Router
- **[React 19](https://react.dev)** - UI library
- **[TypeScript](https://www.typescriptlang.org)** - Type safety

### Backend

- **[tRPC v11](https://trpc.io)** - End-to-end type-safe APIs
- **[Drizzle ORM](https://orm.drizzle.team)** - TypeScript ORM
- **[PostgreSQL 17](https://www.postgresql.org)** - Database
- **[Better Auth](https://better-auth.com)** - Authentication with multi-tenant organizations

### AI & Analytics

- **[Anthropic Claude](https://anthropic.com)** - AI-powered compliance analysis
- **[Recharts](https://recharts.org)** - Data visualization

### UI

- **[Tailwind CSS v4](https://tailwindcss.com)** - Utility-first CSS
- **[Radix UI](https://www.radix-ui.com)** - Accessible components
- **[React Flow](https://reactflow.dev)** - Interactive system map diagrams
- **[Lucide React](https://lucide.dev)** - Icons

### Integrations

- **[Stripe](https://stripe.com)** - Billing and subscriptions
- **[Resend](https://resend.com)** - Transactional emails

## Features

### 📊 Dashboard

Compliance overview with risk metrics, upcoming deadlines, and obligation status.

### 📜 Regulations

Browse and track regulatory frameworks with full-text articles and requirement mapping.

### ✅ Obligations

Manage compliance obligations with ownership, due dates, status tracking, and evidence linking.

### 🗺️ System Map

Interactive visualization of IT systems, data flows, and regulatory touchpoints using React Flow.

### 📦 Evidence Packs

Generate audit-ready evidence packages with automated document collection.

### 🔔 Alerts

Smart notifications for regulatory changes, approaching deadlines, and compliance gaps.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (marketing)/         # Marketing/landing pages
│   ├── api/                 # API routes
│   └── dashboard/
│       ├── alerts/          # Smart alerts
│       ├── evidence-packs/  # Evidence pack generation
│       ├── obligations/     # Obligation management
│       ├── onboarding/      # User onboarding flow
│       ├── regulations/     # Regulation browser
│       ├── settings/        # User/org settings
│       └── system-map/      # Interactive system diagram
├── components/
│   ├── ui/                  # Reusable UI components
│   └── marketing/           # Marketing page components
├── db/                      # Database schema and seeds
├── lib/                     # Shared utilities
├── trpc/                    # tRPC routers and procedures
└── hooks/                   # Custom React hooks
```

## Quick Start

### Prerequisites

- **Bun** (or Node.js 18+)
- **Docker** and **Docker Compose**

### 1. Install Dependencies

```bash
git clone https://github.com/catiemcnama/cindral.git
cd cindral
bun install
```

### 2. Set Up Environment

```bash
cp .env.example .env.local
```

Configure the required environment variables in `.env.local`.

### 3. Start Database

```bash
docker compose up -d
```

### 4. Run Migrations

```bash
bun run db:migrate:up
```

### 5. Seed Data (Optional)

```bash
bun run db:seed
```

### 6. Start Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

| Command                 | Description               |
| ----------------------- | ------------------------- |
| `bun run dev`           | Start development server  |
| `bun run build`         | Build for production      |
| `bun run db:migrate:up` | Apply database migrations |
| `bun run db:studio`     | Open Drizzle Studio       |
| `bun run db:seed`       | Seed the database         |
| `bun run test`          | Run tests                 |
| `bun run test:e2e`      | Run end-to-end tests      |
| `bun run lint`          | Lint codebase             |

## License

MIT
