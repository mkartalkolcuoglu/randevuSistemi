import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth/login', '/api/appointments', '/api/tenants/sync', '/favicon.ico', '/_next'];
  
  // Check if current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('tenant-session');
  
  if (!sessionCookie) {
    // Redirect to login if no session
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Parse session data
    const sessionData = JSON.parse(sessionCookie.value);
    
    if (!sessionData.tenantId) {
      // Invalid session data
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Add tenant ID to headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', sessionData.tenantId);
    
    return response;
  } catch (error) {
    // Invalid session cookie
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
