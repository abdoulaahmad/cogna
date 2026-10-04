import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected paths requiring authenticated sessions
const protectedPaths = ['/orders', '/wallet', '/profile', '/developer', '/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedPaths.some((prefix) => pathname.startsWith(prefix))

  if (isProtected) {
    const hasSessionCookie = request.cookies.get('cogna-session')
    const hasAuthToken = request.cookies.get('cogna-token')

    // If neither session cookie nor auth token exists, redirect to login
    if (!hasSessionCookie && !hasAuthToken) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/orders/:path*',
    '/wallet/:path*',
    '/profile/:path*',
    '/developer/:path*',
    '/admin/:path*',
  ],
}
