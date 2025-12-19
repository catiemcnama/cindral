---
name: tRPC Client Component Guidelines
description: Instructions for using tRPC with TanStack Query in .tsx client components
applyTo: "**/*.tsx"
---

# tRPC Integration for Client Components

This project uses **tRPC v11** with **TanStack React Query** integration. Follow these guidelines when working with `.tsx` files.

## Quick Summary

- **DO use**: `useQuery(trpc.procedure.queryOptions(...))`
- **DON'T use**: `trpc.procedure.useQuery(...)`
- Always use the `useTRPC()` hook to access tRPC procedures
- Pass TanStack Query options as the second argument to `queryOptions()`

## How to Use Queries

```typescript
'use client';

import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';

export function MyComponent() {
  const trpc = useTRPC();

  // Fetch data with useQuery
  const result = useQuery(
    trpc.getUserById.queryOptions(
      { id: '123' },  // First arg: procedure input
      {               // Second arg: TanStack Query options
        staleTime: 5000,
        gcTime: 1000 * 60 * 60, // 1 hour
      }
    )
  );

  if (result.isLoading) return <div>Loading...</div>;
  if (result.error) return <div>Error: {result.error.message}</div>;
  
  return <div>{result.data?.name}</div>;
}
```

## How to Use Mutations

```typescript
'use client';

import { useTRPC } from '@/trpc/client';
import { useMutation } from '@tanstack/react-query';

export function CreateUserComponent() {
  const trpc = useTRPC();

  const createUserMutation = useMutation(
    trpc.createUser.mutationOptions()
  );

  const handleSubmit = (name: string) => {
    createUserMutation.mutate({ name });
  };

  return (
    <div>
      <button onClick={() => handleSubmit('John')}>Create User</button>
      {createUserMutation.isPending && <p>Creating...</p>}
      {createUserMutation.isError && <p>Error creating user</p>}
      {createUserMutation.isSuccess && <p>User created!</p>}
    </div>
  );
}
```

## Conditional Queries (Skip Token)

```typescript
import { skipToken } from '@tanstack/react-query';

const userId = getCurrentUserId(); // could be null/undefined

const userQuery = useQuery(
  userId
    ? trpc.getUserById.queryOptions({ id: userId })
    : skipToken
);
```

## Query Key Manipulation

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate a specific query
queryClient.invalidateQueries({
  queryKey: trpc.getUserById.queryKey({ id: '123' }),
});

// Get cached data
const cachedUser = queryClient.getQueryData(
  trpc.getUserById.queryKey({ id: '123' })
);

// Set cached data
queryClient.setQueryData(
  trpc.getUserById.queryKey({ id: '123' }),
  { id: '123', name: 'Jane' }
);
```

## Important Rules

1. **Always mark client components with 'use client'** at the top of the file when using hooks
2. **Use `useTRPC()` to access procedures**, never import the tRPC instance directly
3. **Use TanStack Query hooks** (`useQuery`, `useMutation`, `useInfiniteQuery`, etc.) rather than tRPC-specific hooks
4. **Pass options correctly**: First argument is the procedure input, second argument is TanStack Query options
5. **Never use the old pattern** with `.useQuery()` directly on the tRPC object

## Reference Documentation

- [tRPC Docs](https://trpc.io/docs)
- [tRPC + TanStack Query Integration](https://trpc.io/docs/client/tanstack-react-query/usage)
- [TanStack Query API](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Project README](/README.md) - Full setup and usage guide
