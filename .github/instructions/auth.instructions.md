---
name: Better Auth & Organizations
description: Instructions for using better-auth with organization/multi-tenant support in this project
applyTo: '**/*.{ts,tsx}'
---

# Better Auth & Organizations Setup

This project uses **Better Auth** for authentication and authorization with full organization (multi-tenant) support.

## Overview

Better-auth provides:

- **Email/password authentication**
- **OAuth providers** (configurable)
- **Session management** with secure cookies
- **Organization/multi-tenant** support
- **Role-based access control** (RBAC)
- **Member invitations** via email
- **Drizzle ORM integration**

## Architecture

### Server Components

**1. Auth Configuration** - [`src/lib/auth.ts`](src/lib/auth.ts)

- Configures betterAuth with Drizzle adapter
- Enables organization plugin with roles
- Defines invitation email handling

**2. API Route** - [`src/app/api/auth/[...all]/route.ts`](src/app/api/auth/[...all]/route.ts)

- Handles all auth endpoints via `/api/auth/*`
- Manages sign-in, sign-up, sessions, etc.

**3. tRPC Integration** - [`src/trpc/init.ts`](src/trpc/init.ts)

- Adds session to tRPC context
- Provides `protectedProcedure` for authenticated routes
- Provides `orgProcedure` for organization-scoped routes

### Client Components

**Auth Client** - [`src/lib/auth-client.ts`](src/lib/auth-client.ts)

- Client-side auth methods
- Organization management hooks
- Type-safe with server inference

## Database Schema

Better Auth generates its schema in `auth-schema.ts` which is then imported and re-exported in your main `src/db/schema.ts`. This approach allows you to regenerate the auth schema at any time without manual copying.

**To regenerate the auth schema:**

```bash
bunx @better-auth/cli generate
```

This will update `auth-schema.ts` with the latest schema from better-auth, and your app will automatically pick up the changes since `src/db/schema.ts` imports from it.

### Core Auth Tables

- **user** - User accounts (id, name, email, emailVerified, image)
- **session** - Active sessions with expiry and activeOrganizationId
- **account** - OAuth accounts and password hashes
- **verification** - Email verification tokens

### Organization Tables

- **organization** - Organizations/tenants (id, name, slug, logo, metadata)
- **member** - Organization memberships (userId, organizationId, role)
- **invitation** - Pending invitations (email, organizationId, role, status)

### Application Tables

Your app tables should reference these auth tables:

```typescript
export const posts = pgTable('posts', {
  // ...
  userId: text('user_id').references(() => user.id),
  organizationId: text('organization_id').references(() => organization.id),
})
```

## Usage Patterns

### Server-Side Authentication

#### In Server Components / Route Handlers

```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// Get current session
const session = await auth.api.getSession({
  headers: await headers(),
})

if (!session) {
  redirect('/sign-in')
}

// Access user
const user = session.user
const activeOrgId = session.activeOrganizationId
```

#### In tRPC Procedures

```typescript
import { protectedProcedure, orgProcedure, router } from '@/trpc/init'

export const myRouter = router({
  // Requires authentication
  getProfile: protectedProcedure.query(async (opts) => {
    const userId = opts.ctx.user.id // user is available
    // ...
  }),

  // Requires authentication + active organization
  getOrgData: orgProcedure.query(async (opts) => {
    const orgId = opts.ctx.activeOrganizationId
    const member = opts.ctx.member // member info with role
    // ...
  }),
})
```

### Client-Side Authentication

#### Using Hooks

```tsx
'use client'

import { useSession, signIn, signOut } from '@/lib/auth-client'

export function MyComponent() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Loading...</div>

  if (!session) {
    return (
      <button
        onClick={() =>
          signIn.email({
            email: 'user@example.com',
            password: 'password123',
          })
        }
      >
        Sign In
      </button>
    )
  }

  return (
    <div>
      <p>Welcome {session.user.name}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}
```

#### With tRPC (Client Components)

Per the tRPC instructions, use this pattern:

```tsx
'use client'

import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'

export function MyOrganizations() {
  const trpc = useTRPC()

  const { data, isLoading } = useQuery(trpc.getMyOrganizations.queryOptions())

  if (isLoading) return <div>Loading...</div>

  return (
    <ul>
      {data?.map((org) => (
        <li key={org.id}>
          {org.name} - {org.role}
        </li>
      ))}
    </ul>
  )
}
```

## Organization Management

### Client-Side Organization Operations

```tsx
import { organization, useActiveOrganization } from '@/lib/auth-client'

// Get active organization
const { data: activeOrg } = useActiveOrganization()

// Create organization
await organization.create({
  name: 'My Company',
  slug: 'my-company',
})

// List user's organizations
const orgs = await organization.list()

// Set active organization
await organization.setActive({
  organizationId: 'org-id',
})

// Invite member
await organization.inviteMember({
  email: 'user@example.com',
  role: 'member', // or 'admin', 'owner'
})

// List members
const members = await organization.listMembers({
  organizationId: 'org-id',
})

// Remove member
await organization.removeMember({
  memberIdOrUserId: 'user-id',
  organizationId: 'org-id',
})

// Update member role
await organization.updateMemberRole({
  memberIdOrUserId: 'user-id',
  role: 'admin',
  organizationId: 'org-id',
})
```

### Server-Side Organization Queries

```typescript
import { db } from '@/db'
import { eq, and } from 'drizzle-orm'

// Get organization by ID
const org = await db.query.organization.findFirst({
  where: eq(organization.id, orgId),
})

// Get user's organizations
const memberships = await db.query.member.findMany({
  where: eq(member.userId, userId),
  with: { organization: true },
})

// Get organization members
const members = await db.query.member.findMany({
  where: eq(member.organizationId, orgId),
  with: { user: true },
})

// Check if user is org member
const membership = await db.query.member.findFirst({
  where: and(eq(member.userId, userId), eq(member.organizationId, orgId)),
})
```

## Roles & Permissions

Default roles configured in [`src/lib/auth.ts`](src/lib/auth.ts):

- **owner** - Full access (create, read, update, delete, invite, remove, manage)
- **admin** - Management access (read, update, invite, manage)
- **member** - Read-only access (read)

### Checking Permissions in tRPC

```typescript
export const deleteOrganization = orgProcedure
  .input(z.object({ organizationId: z.string() }))
  .mutation(async (opts) => {
    const { member } = opts.ctx

    // Check role
    if (member.role !== 'owner') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only owners can delete organizations',
      })
    }

    // Proceed with deletion
    await opts.ctx.db.delete(organization).where(eq(organization.id, opts.input.organizationId))
  })
```

## Environment Variables

Add to your `.env.local`:

```bash
# Required for better-auth
BETTER_AUTH_SECRET=<generate-a-random-secret>
BETTER_AUTH_URL=http://localhost:3000

# Optional: For production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional: OAuth providers
# GITHUB_CLIENT_ID=your_github_client_id
# GITHUB_CLIENT_SECRET=your_github_client_secret
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Generate a secret:

```bash
openssl rand -base64 32
```

## Email Verification & Invitations

Currently, invitation emails are logged to console (see [`src/lib/auth.ts`](src/lib/auth.ts)).

To implement real emails, install an email provider and update the `sendInvitationEmail` function:

```typescript
import { sendEmail } from '@/lib/email'; // Your email service

async sendInvitationEmail(data) {
  await sendEmail({
    to: data.email,
    subject: `Join ${data.organization.name}`,
    html: `
      <p>${data.inviter.user.name} invited you to join ${data.organization.name}</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${data.id}">
        Accept Invitation
      </a>
    `,
  });
}
```

## Common Patterns

### Middleware Protection

Create [`src/middleware.ts`](src/middleware.ts) for Next.js 15.2+:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.next()
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/dashboard/:path*', '/settings/:path*'],
}
```

### Organization Context Provider

Create a client component to provide org context:

```tsx
'use client'

import { useActiveOrganization } from '@/lib/auth-client'
import { createContext, useContext } from 'react'

const OrgContext = createContext<any>(null)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { data: activeOrg, isPending } = useActiveOrganization()

  return <OrgContext.Provider value={{ activeOrg, isPending }}>{children}</OrgContext.Provider>
}

export const useOrganization = () => useContext(OrgContext)
```

## Testing Authentication

Test your auth setup:

1. **Start the dev server**: `bun run dev`
2. **Create a user**: POST to `/api/auth/sign-up`
3. **Sign in**: POST to `/api/auth/sign-in`
4. **Create organization**: Use `organization.create()`
5. **Test tRPC**: Call `getMyOrganizations` procedure

## Troubleshooting

### Session not persisting

- Check cookies are enabled
- Verify `BETTER_AUTH_URL` matches your domain
- Check browser console for CORS errors

### Organization queries failing

- Ensure user has set an active organization
- Check `session.activeOrganizationId` is not null
- Verify member record exists

### tRPC unauthorized errors

- Session might be expired
- Re-authenticate the user
- Check server logs for detailed errors

## References

- [Better Auth Docs](https://better-auth.com/docs)
- [Organization Plugin](https://better-auth.com/docs/plugins/organization)
- [Drizzle Adapter](https://better-auth.com/docs/adapters/drizzle)
- [Next.js Integration](https://better-auth.com/docs/integrations/next)
