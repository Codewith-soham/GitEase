import { NextResponse, type NextRequest } from 'next/server'

// Cookie presence only — signature/expiry validation still happens
// server-side via the existing /api/auth/v1/me + refresh-token flow.
// This just stops fully logged-out visitors from downloading the dashboard
// JS bundle and rendering a shell before finding out they need to log in.
export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has('accessToken') || request.cookies.has('refreshToken')

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/repositories/:path*',
    '/settings/:path*',
    '/teams/:path*',
    '/workspace/:path*',
    '/activity/:path*',
    '/agent/:path*',
  ],
}
