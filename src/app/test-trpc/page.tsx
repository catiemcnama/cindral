'use client';

import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function TestTrpcPage() {
    const [name, setName] = useState('World');
    const [inputValue, setInputValue] = useState('World');
    
    const trpc = useTRPC();

  // Query example - using TanStack Query's useQuery with tRPC's queryOptions
  const hello = useQuery(
    trpc.hello.queryOptions(
      { text: name },
      {
        // Example of TanStack Query options
        staleTime: 5000,
      }
    )
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setName(inputValue);
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">tRPC + TanStack Query Test</h1>
        <p className="text-muted-foreground">
          Testing the integration between tRPC and TanStack Query in Next.js App Router.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Query Test</CardTitle>
          <CardDescription>Change the input to trigger a new query</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter name..."
            />
            <Button type="submit">Update</Button>
          </form>

          <div className="p-4 bg-muted rounded-lg min-h-[100px] flex items-center justify-center">
            {hello.isLoading ? (
              <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            ) : hello.error ? (
              <p className="text-destructive">Error: {hello.error.message}</p>
            ) : (
              <div className="text-center">
                <p className="text-lg font-medium">{hello.data?.greeting}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Query Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>Status: <span className="font-mono">{hello.status}</span></li>
              <li>Fetching: <span className="font-mono">{hello.isFetching ? 'Yes' : 'No'}</span></li>
              <li>Stale: <span className="font-mono">{hello.isStale ? 'Yes' : 'No'}</span></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
