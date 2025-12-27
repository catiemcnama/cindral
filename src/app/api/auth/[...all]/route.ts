import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

const handler = toNextJsHandler(auth)

// #region agent log
export async function GET(request: Request) {
  return handler.GET(request)
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // Clone to read body without consuming
  const cloned = request.clone()
  let body: Record<string, unknown> = {}
  try {
    body = await cloned.json()
  } catch {
    // not JSON
  }

  // Log sign-in attempts
  if (pathname.includes('sign-in')) {
    console.log('[AUTH] Sign-in attempt:', {
      email: body.email,
      hasPassword: !!body.password,
      pathname,
    })
  }

  const response = await handler.POST(request)

  // Log result
  if (pathname.includes('sign-in')) {
    // Try to get response body for error details
    const resClone = response.clone()
    let resBody: unknown = null
    try {
      resBody = await resClone.json()
    } catch {
      // not JSON
    }

    console.log('[AUTH] Sign-in result:', {
      status: response.status,
      email: body.email,
      responseBody: resBody,
    })
  }

  return response
}
// #endregion
