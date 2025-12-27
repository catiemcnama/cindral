import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'
import { NextRequest } from 'next/server'

// #region agent log - Server-side auth debugging
const handler = toNextJsHandler(auth)

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  console.log('[DEBUG-AUTH-API] GET request:', {
    pathname: url.pathname,
    searchParams: Object.fromEntries(url.searchParams),
    origin: request.headers.get('origin'),
    host: request.headers.get('host'),
  })
  return handler.GET(request)
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  // Clone request to read body without consuming it
  const clonedRequest = request.clone()
  let body: unknown = null
  try {
    body = await clonedRequest.json()
    // Remove password from logs for security
    if (body && typeof body === 'object' && 'password' in body) {
      body = { ...body, password: '[REDACTED]' }
    }
  } catch {
    body = 'Could not parse body'
  }

  console.log('[DEBUG-AUTH-API] POST request:', {
    pathname: url.pathname,
    origin: request.headers.get('origin'),
    host: request.headers.get('host'),
    body,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  })

  const response = await handler.POST(request)

  // Log response status
  console.log('[DEBUG-AUTH-API] POST response:', {
    status: response.status,
    statusText: response.statusText,
  })

  return response
}
// #endregion
