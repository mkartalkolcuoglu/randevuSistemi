import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Page to permission key mapping
const pagePermissions: Record<string, string> = {
  '/admin': 'dashboard',
  '/admin/appointments': 'appointments',
  '/admin/customers': 'customers',
  '/admin/services': 'services',
  '/admin/staff': 'staff',
  '/admin/packages': 'packages',
  '/admin/kasa': 'kasa',
  '/admin/stock': 'stock',
  '/admin/reports': 'reports',
  '/admin/settings': 'settings',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/api/auth/login', 
    '/api/appointments', 
    '/api/customer-packages/check',  // Allow web app to check customer packages
    '/api/tenants/sync', 
    '/favicon.ico', 
    '/_next'
  ];
  
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

    // Permission check for staff users
    if (sessionData.userType === 'staff' && sessionData.permissions) {
      // Find matching page permission
      let requiredPermission: string | null = null;
      
      for (const [path, permission] of Object.entries(pagePermissions)) {
        if (pathname === path || pathname.startsWith(path + '/')) {
          requiredPermission = permission;
          break;
        }
      }

      // If this is a protected admin page
      if (requiredPermission) {
        const permissions = sessionData.permissions;
        
        // Check if user has read permission for this page
        if (!permissions[requiredPermission]?.read) {
          console.log(`🚫 Access denied: ${sessionData.ownerName} tried to access ${pathname}`);
          console.log(`Required permission: ${requiredPermission}, Has read: ${permissions[requiredPermission]?.read}`);
          
          // Redirect to dashboard with error
          const redirectUrl = new URL('/admin', request.url);
          redirectUrl.searchParams.set('error', 'permission_denied');
          return NextResponse.redirect(redirectUrl);
        }
      }
    }

    // Add tenant ID to headers for API routes
    const response = NextResponse.next();
    response.headers.set('x-tenant-id', sessionData.tenantId);
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
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
