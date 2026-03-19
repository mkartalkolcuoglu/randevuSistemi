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
  '/admin/performans': 'reports',
  '/admin/settings': 'settings',
};

// Default restricted permissions for staff with null permissions
const DEFAULT_STAFF_PERMISSIONS: Record<string, { read: boolean }> = {
  dashboard: { read: true },
  appointments: { read: true },
  customers: { read: true },
  services: { read: true },
  staff: { read: false },
  packages: { read: false },
  kasa: { read: false },
  stock: { read: true },
  reports: { read: false },
  settings: { read: false },
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/api/auth/login',
    '/api/appointments',
    '/api/customer-packages/check',  // Allow web app to check customer packages
    '/api/public',  // ✅ Allow all public API routes (tenant, check-blacklist, etc.)
    '/api/mobile',  // ✅ Allow mobile app API routes (auth handled via JWT)
    '/api/whatsapp',  // ✅ Allow WhatsApp API routes (internal use, will check auth in route)
    '/api/whapi',  // ✅ Allow Whapi API routes (for cron jobs)
    '/api/netgsm',  // ✅ Allow NetGSM API routes (for cron jobs)
    '/api/cron',  // ✅ Allow cron job routes (protected by CRON_SECRET)
    '/api/debug',  // ✅ Allow debug routes (for troubleshooting)
    '/api/tenants/sync',
    '/api/subscription',  // ✅ Allow subscription API routes
    '/admin/select-subscription',  // ✅ Allow subscription selection page
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

    // Subscription check - for both owner and staff
    if (sessionData.userType === 'owner' || sessionData.userType === 'staff') {
      if (sessionData.subscriptionEnd) {
        const subscriptionEnd = new Date(sessionData.subscriptionEnd);
        const now = new Date();

        console.log('🔍 Subscription check:', {
          subscriptionEnd: subscriptionEnd.toISOString(),
          now: now.toISOString(),
          isExpired: subscriptionEnd < now,
          pathname
        });

        // Subscription dolmuşsa ve subscription sayfasında değilse, redirect et
        if (subscriptionEnd < now && !pathname.startsWith('/admin/select-subscription')) {
          console.log('⚠️ Redirecting to subscription page');
          if (sessionData.userType === 'staff') {
            // Staff can't manage subscription — allow dashboard only with warning
            if (pathname === '/admin' || pathname === '/admin/') {
              return NextResponse.next();
            }
            const redirectUrl = new URL('/admin', request.url);
            redirectUrl.searchParams.set('error', 'subscription_expired');
            return NextResponse.redirect(redirectUrl);
          }
          return NextResponse.redirect(new URL('/admin/select-subscription', request.url));
        }
      }
      // Eğer subscriptionEnd null ise, normal devam et (eski tenant'lar için)
    }

    // Permission check for staff users
    if (sessionData.userType === 'staff') {
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
        // Use actual permissions or default restricted permissions if null
        const permissions = sessionData.permissions || DEFAULT_STAFF_PERMISSIONS;

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
