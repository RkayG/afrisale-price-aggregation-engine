import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_access_token')?.value

    // If token is missing or doesn't match the secret, return 404
    if (!token || token !== process.env.ADMIN_SECRET_TOKEN) {
      // Rewrite to /404 to show our custom not-found page while 
      // keeping the URL intact and hiding the dashboard.
      const url = request.nextUrl.clone()
      url.pathname = '/404'
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

// Only run middleware on /admin paths
export const config = {
  matcher: '/admin/:path*',
}
