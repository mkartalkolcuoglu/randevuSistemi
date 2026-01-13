import { NextRequest, NextResponse } from 'next/server';

// System routes (not tenant slugs)
const SYSTEM_ROUTES = [
  'register',
  'test',
  '_next',
  'favicon.ico',
  'pwa',
  'randevularim',
  'payment',
];

// Cache for page slugs (refreshes every 60 seconds)
let pageSlugsCache: Set<string> = new Set();
let lastCacheUpdate = 0;
const CACHE_TTL = 60000; // 60 seconds

async function fetchPageSlugs(): Promise<Set<string>> {
  const now = Date.now();

  // Return cached data if fresh
  if (now - lastCacheUpdate < CACHE_TTL && pageSlugsCache.size > 0) {
    return pageSlugsCache;
  }

  try {
    const projectAdminUrl = process.env.PROJECT_ADMIN_URL || 'https://yonetim.netrandevu.com';
    const response = await fetch(`${projectAdminUrl}/api/pages`, {
      next: { revalidate: 60 }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        pageSlugsCache = new Set(
          data.data
            .filter((page: any) => page.isActive)
            .map((page: any) => page.slug)
        );
        lastCacheUpdate = now;
      }
    }
  } catch (error) {
    console.error('Error fetching page slugs in middleware:', error);
  }

  return pageSlugsCache;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Ana sayfa kontrolü
  if (url.pathname === '/') {
    return NextResponse.next();
  }

  // API routes'ları geç
  if (url.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Get first segment
  const firstSegment = url.pathname.split('/')[1];

  // System routes kontrolü
  if (SYSTEM_ROUTES.includes(firstSegment)) {
    return NextResponse.next();
  }

  // Check if this is a CMS page slug (dynamic)
  const pageSlugs = await fetchPageSlugs();
  if (pageSlugs.has(firstSegment)) {
    // This is a CMS page, mark it and continue
    const response = NextResponse.next();
    response.headers.set('x-is-cms-page', 'true');
    return response;
  }

  // If not a page, treat as tenant slug
  const slugMatch = url.pathname.match(/^\/([^\/]+)/);
  if (slugMatch) {
    const slug = slugMatch[1];

    // Geçerli slug kontrolü
    if (slug && slug.length > 0 && !slug.startsWith('_') && !slug.startsWith('.')) {
      // Slug'ı header olarak ekle - tenant route
      const response = NextResponse.next();
      response.headers.set('x-tenant-slug', slug);
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
