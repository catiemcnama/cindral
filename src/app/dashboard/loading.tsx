import { PageLoadingSkeleton } from '@/components/ui/skeletons'

/**
 * Route-level loading UI for dashboard
 *
 * This is shown during:
 * - Initial page load
 * - Route transitions
 * - Suspense boundaries
 */
export default function DashboardLoading() {
  return <PageLoadingSkeleton />
}
