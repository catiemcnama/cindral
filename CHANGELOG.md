# Changelog

All notable changes to Cindral are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-22

### Added

#### Core Platform

- **Dashboard** - Real-time compliance overview with key metrics
- **Regulations Management** - Track DORA, GDPR, AI Act, Basel III, and custom regulations
- **Articles Browser** - View and navigate regulatory articles with AI summaries
- **Obligations Tracking** - 5-state workflow (Not Started → Verified)
- **Alerts System** - Smart alerts for regulatory changes and deadlines
- **Evidence Packs** - Generate audit-ready compliance documentation

#### Interactive System Map

- Visual representation of system-regulation relationships
- Drag-and-drop node positioning with persistence
- Hierarchical layout (Regulations → Articles → Systems)
- Impact level visualization with color coding
- Export to PNG/SVG
- Filtering by regulation, impact level, and category

#### Authentication & Security

- Email/password authentication with Better Auth
- OAuth support (Google, Microsoft, GitHub)
- Email verification flow
- Password reset with secure tokens
- Rate limiting on auth endpoints
- Session management with secure tokens
- Organization-based multi-tenancy

#### Onboarding

- 4-step guided setup wizard
- Industry selection with regulation recommendations
- System template library
- Team invitation system

#### Integrations

- Jira integration (OAuth + issue sync)
- Confluence integration (OAuth + page export)
- Webhook support for custom integrations
- Integration status monitoring

#### Billing

- Stripe integration for subscriptions
- Free, Starter, and Professional plans
- Usage tracking and limits
- Billing portal integration

#### AI Features

- Article summarization with Claude
- Obligation extraction from regulatory text
- Impact assessment for system-regulation mapping
- Response caching (7-day TTL)

#### Analytics & Monitoring

- Sentry error tracking integration
- Performance monitoring
- User behavior analytics (Amplitude ready)
- Structured logging with JSON output

#### Developer Experience

- TypeScript throughout
- tRPC for type-safe APIs
- Drizzle ORM for database
- Vitest for unit/integration testing
- Playwright for E2E testing
- ESLint + Prettier for code quality
- Husky pre-commit hooks
- GitHub Actions CI/CD

#### Documentation

- Getting Started guide
- Database schema documentation
- API documentation
- Deployment checklist

### Security

- Organization-level tenant isolation
- Row-level security patterns
- RBAC with 5 role types
- Audit logging for all mutations
- Soft deletes for data recovery
- Input validation with Zod

### Infrastructure

- PostgreSQL database with connection pooling
- Serverless-ready architecture
- Edge-compatible where possible
- Database migrations with Drizzle Kit

## [0.1.0] - Initial Development

- Project scaffolding
- Database schema design
- Basic authentication
- Initial UI components

---

## Migration Notes

### From 0.x to 1.0.0

This is the first production release. No migration required.

### Database Migrations

All database changes are managed through Drizzle migrations:

```bash
# Check migration status
npm run db:migrate:status

# Apply pending migrations
npm run db:migrate:up

# Rollback last migration
npm run db:migrate:rollback
```

---

## Roadmap

### 1.1.0 (Planned)

- Real-time collaboration features
- Advanced reporting and exports
- Custom regulation templates
- API rate limiting dashboard

### 1.2.0 (Planned)

- ServiceNow integration
- Slack/Teams notifications
- Compliance calendar view
- Bulk operations UI

---

_Built with intensity. Shipped with pride. Ready for YC._
