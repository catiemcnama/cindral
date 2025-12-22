# Deployment Checklist

## Pre-Deployment

### Environment Variables

Ensure all required environment variables are set in your deployment platform:

```bash
# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.trycindral.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/cindral

# Auth
BETTER_AUTH_SECRET=<32+ character random string>
BETTER_AUTH_URL=https://app.trycindral.com

# OAuth (Optional - enable features you need)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_ENABLED=true
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
NEXT_PUBLIC_MICROSOFT_ENABLED=true
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXT_PUBLIC_GITHUB_ENABLED=true

# Email Verification
REQUIRE_EMAIL_VERIFICATION=true

# AI (Required for AI features)
ANTHROPIC_API_KEY=

# Stripe (Required for billing)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_STARTER_MONTHLY=
STRIPE_PRICE_ID_STARTER_ANNUAL=
STRIPE_PRICE_ID_PRO_MONTHLY=
STRIPE_PRICE_ID_PRO_ANNUAL=

# Monitoring (Recommended)
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Analytics (Optional)
NEXT_PUBLIC_AMPLITUDE_API_KEY=
```

### Database

- [ ] Run migrations: `npm run db:migrate:up`
- [ ] Verify migration status: `npm run db:migrate:status`
- [ ] Seed demo data (if needed): `npm run db:seed`
- [ ] Test database connectivity

### Build

- [ ] Run type check: `npm run type-check`
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm run test:run`
- [ ] Build application: `npm run build`

### External Services

- [ ] Stripe webhooks configured to `https://app.trycindral.com/api/webhooks/stripe`
- [ ] OAuth redirect URIs configured for all providers
- [ ] Email provider (Resend/SendGrid) configured
- [ ] Sentry project created and DSN obtained
- [ ] Analytics account set up

## Deployment Steps

### Vercel (Recommended)

1. Connect repository to Vercel
2. Set all environment variables in project settings
3. Configure domain (app.trycindral.com)
4. Enable automatic deployments from main branch
5. Run initial deployment

### Docker

```bash
# Build image
docker build -t cindral-web .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET \
  # ... other env vars
  cindral-web
```

### Manual

```bash
# Install dependencies
npm ci

# Build
npm run build

# Start
npm start
```

## Post-Deployment

### Verification

- [ ] Homepage loads correctly
- [ ] Sign up flow works
- [ ] Sign in flow works
- [ ] OAuth providers work (if enabled)
- [ ] Dashboard loads for authenticated users
- [ ] API health check: `GET /api/health/db`
- [ ] Stripe webhook test event succeeds

### Monitoring

- [ ] Sentry receiving errors
- [ ] Analytics tracking events
- [ ] Database connection pool healthy
- [ ] Response times acceptable (<500ms p95)

### Backup

- [ ] Database backup configured (daily recommended)
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented

## Rollback Procedure

### Quick Rollback (Vercel)

1. Go to Vercel dashboard
2. Navigate to Deployments
3. Find previous working deployment
4. Click "..." > "Promote to Production"

### Database Rollback

```bash
# Check current migration status
npm run db:migrate:status

# Rollback last migration
npm run db:migrate:rollback
```

## Troubleshooting

### Common Issues

**Build fails with type errors:**

- Run `npm run type-check` locally to identify issues
- Check for missing environment variables

**Database connection errors:**

- Verify DATABASE_URL is correct
- Check if database allows connections from deployment IP
- Verify SSL configuration

**OAuth not working:**

- Verify redirect URIs match exactly
- Check client ID and secret are correct
- Ensure provider is enabled in environment

**Stripe webhooks failing:**

- Verify webhook secret is correct
- Check endpoint URL is accessible
- Review webhook logs in Stripe dashboard

## Performance Targets

| Metric                         | Target |
| ------------------------------ | ------ |
| Time to First Byte (TTFB)      | <200ms |
| First Contentful Paint (FCP)   | <1.5s  |
| Largest Contentful Paint (LCP) | <2.5s  |
| First Input Delay (FID)        | <100ms |
| Cumulative Layout Shift (CLS)  | <0.1   |
| Lighthouse Score               | >90    |

## Security Checklist

- [ ] All secrets stored in environment variables (not in code)
- [ ] HTTPS enforced
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Rate limiting enabled on auth endpoints
- [ ] Input validation on all API endpoints
- [ ] SQL injection prevention (using Drizzle ORM)
- [ ] XSS prevention (React escaping)
- [ ] CSRF protection on mutations

## Support

For deployment assistance:

- Documentation: https://docs.trycindral.com
- Support: support@trycindral.com
- Status: https://status.trycindral.com
