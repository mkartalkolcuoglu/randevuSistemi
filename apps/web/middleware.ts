import { NextRequest, NextResponse } from 'next/server';

// Statik route'lar (tenant değil, özel sayfalar)
const STATIC_ROUTES = [
  'register',
  'test',
  'hakkimizda',
  'gizlilik',
  'kvkk',
  'kvkk-sozlesmesi',
  'kariyer',
  'iletisim',
  'kullanim-kosullari',
  '_next',
  'favicon.ico',
];

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Ana sayfa kontrolü
  if (url.pathname === '/') {
    return NextResponse.next();
  }

  // API routes'ları geç
  if (url.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Statik route kontrolü (CMS pages dahil)
  const firstSegment = url.pathname.split('/')[1];
  if (STATIC_ROUTES.includes(firstSegment)) {
    return NextResponse.next();
  }

  // Tenant slug ile gelen istekler
  const slugMatch = url.pathname.match(/^\/([^\/]+)/);
  if (slugMatch) {
    const slug = slugMatch[1];
    
    // Geçerli slug kontrolü (basit kontrol)
    if (slug && slug.length > 0 && !slug.startsWith('_') && !slug.startsWith('.')) {
      // Slug'ı header olarak ekle - sayfa bu slug'ı kullanacak
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
