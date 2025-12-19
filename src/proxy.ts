import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // Check if the request is for a protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/app')

  if (isProtectedRoute && !session) {
    // Redirect to signin if not authenticated
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // Redirect authenticated users away from auth pages
  const isAuthPage = request.nextUrl.pathname.startsWith('/signin') || request.nextUrl.pathname.startsWith('/signup')

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
