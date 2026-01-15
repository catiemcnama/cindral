import { checkHealth } from '@/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  checks: {
    database: {
      status: 'up' | 'down'
      latencyMs?: number
      error?: string
    }
  }
}

/**
 * Root health check endpoint for load balancers and orchestrators.
 * Returns 200 if the service is healthy, 503 if unhealthy.
 *
 * GET /api/health
 */
export async function GET(): Promise<NextResponse<HealthStatus>> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  const version = process.env.npm_package_version || '0.1.0'

  // Check database connectivity
  let dbStatus: HealthStatus['checks']['database']

  try {
    const dbHealth = await checkHealth()
    dbStatus = {
      status: dbHealth.connected ? 'up' : 'down',
      latencyMs: dbHealth.latencyMs,
      error: dbHealth.error,
    }
  } catch (error) {
    dbStatus = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }

  const isHealthy = dbStatus.status === 'up'

  const response: HealthStatus = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp,
    version,
    checks: {
      database: dbStatus,
    },
  }

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  })
}

/**
 * HEAD request for minimal health probes (e.g., Kubernetes liveness)
 */
export async function HEAD(): Promise<NextResponse> {
  try {
    const dbHealth = await checkHealth()

    if (dbHealth.connected) {
      return new NextResponse(null, { status: 200 })
    }
    return new NextResponse(null, { status: 503 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
