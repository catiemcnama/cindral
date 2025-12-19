# Cindral Web

A [Next.js](https://nextjs.org) project with the App Router, using [tRPC](https://trpc.io) for type-safe API communication and [TanStack Query](https://tanstack.com/query) for state management.

## Getting Started

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Architecture

### tRPC Integration

This project uses **tRPC v11** with **TanStack React Query** integration for end-to-end type-safe API communication.

#### Key Directories

- **`src/trpc/init.ts`** - tRPC backend initialization and context setup
- **`src/trpc/client.tsx`** - Client provider and React Context setup
- **`src/trpc/server.tsx`** - Server Component helpers for prefetching and hydration
- **`src/trpc/query-client.ts`** - Shared QueryClient configuration
- **`src/trpc/routers/_app.ts`** - Root API router definition
- **`src/app/api/trpc/[trpc]/route.ts`** - tRPC API endpoint

### How to Use tRPC

#### 1. Define a Procedure in the Router

Add new procedures to `src/trpc/routers/_app.ts`:

```typescript
import { z } from 'zod';
import { publicProcedure, router } from '../init';

export const appRouter = router({
  // Queries
  getUserById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (opts) => {
      // Access input: opts.input.id
      return { id: opts.input.id, name: 'John Doe' };
    }),

  // Mutations
  createUser: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async (opts) => {
      // Access input: opts.input.name
      return { id: 'user_123', name: opts.input.name };
    }),
});

export type AppRouter = typeof appRouter;
```

#### 2. Use in Client Components

Always use `useTRPC()` hook with TanStack Query's `useQuery`, `useMutation`, and related hooks:

```typescript
'use client';

import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';

export function MyComponent() {
  const trpc = useTRPC();

  // For queries - use queryOptions
  const user = useQuery(
    trpc.getUserById.queryOptions({ id: '123' })
  );

  // For mutations - use mutationOptions
  const createUserMutation = useMutation(
    trpc.createUser.mutationOptions()
  );

  // Access data, status, and trigger mutations
  return (
    <div>
      {user.isLoading && <p>Loading...</p>}
      {user.data && <p>{user.data.name}</p>}
      <button onClick={() => createUserMutation.mutate({ name: 'Jane' })}>
        Create User
      </button>
    </div>
  );
}
```

#### 3. Use in Server Components (RSC) with Prefetching

For Server Components, prefetch data using the `trpc` helper from `src/trpc/server.tsx`:

```typescript
import { HydrateClient, trpc } from '@/trpc/server';

export default async function Page() {
  // Prefetch data on the server
  void trpc.getUserById.prefetch({ id: '123' });

  return (
    <HydrateClient>
      {/* Client components here will have prefetched data hydrated */}
      <MyComponent />
    </HydrateClient>
  );
}
```

#### 4. Advanced Patterns

**Query Key Manipulation:**
```typescript
const queryClient = useQueryClient();

// Invalidate a specific query
queryClient.invalidateQueries({
  queryKey: trpc.getUserById.queryKey({ id: '123' }),
});

// Get cached data
const cachedData = queryClient.getQueryData(
  trpc.getUserById.queryKey({ id: '123' })
);
```

**Conditional Queries:**
```typescript
import { skipToken } from '@tanstack/react-query';

const user = useQuery(
  userId
    ? trpc.getUserById.queryOptions({ id: userId })
    : skipToken
);
```

## Important Notes

⚠️ **DO NOT** use the old tRPC React Query integration pattern:
- ❌ `trpc.hello.useQuery(...)` - This is the old pattern
- ✅ `useQuery(trpc.hello.queryOptions(...))` - This is the correct pattern

The modern approach provides better TypeScript support, cleaner composition with TanStack Query features, and follows the official recommendation.

## Testing

Visit [http://localhost:3000/test-trpc](http://localhost:3000/test-trpc) to see a working example of the tRPC + TanStack Query integration.

## Learn More

- [tRPC Documentation](https://trpc.io/docs)
- [tRPC + TanStack Query Integration](https://trpc.io/docs/client/tanstack-react-query)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Next.js Documentation](https://nextjs.org/docs)
