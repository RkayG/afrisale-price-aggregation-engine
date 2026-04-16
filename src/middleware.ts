import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_access_token')?.value

    // If token is missing or doesn't match the secret, return 404
    if (!token || token !== process.env.ADMIN_SECRET_TOKEN) {
      // We return a 404 instead of a redirect to 
      // make the admin panel completely undiscoverable.
      return new NextResponse(null, { status: 404 })
    }
  }

  return NextResponse.next()
}

// Only run middleware on /admin paths
export const config = {
  matcher: '/admin/:path*',
}
