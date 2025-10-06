import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Ana domain - proje yönetimi için
  if (host === 'localhost:3000' || host.includes('randevusistemi.com')) {
    // Ana sayfa - proje tanıtımı
    if (url.pathname === '/') {
      return NextResponse.next();
    }
    
    // Proje admin paneli
    if (url.pathname.startsWith('/project-admin')) {
      url.pathname = url.pathname.replace('/project-admin', '');
      return NextResponse.rewrite(new URL('http://localhost:3002' + url.pathname + url.search));
    }
    
    // Tenant slug ile gelen istekler
    const slugMatch = url.pathname.match(/^\/([^\/]+)/);
    if (slugMatch) {
      const slug = slugMatch[1];
      
      // Admin panel kontrolü
      if (url.pathname.startsWith(`/${slug}/admin`)) {
        url.pathname = url.pathname.replace(`/${slug}/admin`, '');
        return NextResponse.rewrite(new URL('http://localhost:3001' + url.pathname + url.search));
      }
      
      // Tenant web sayfası
      url.pathname = url.pathname.replace(`/${slug}`, '');
      
      // Slug'ı header olarak ekle
      const response = NextResponse.next();
      if (slug) {
        response.headers.set('x-tenant-slug', slug);
      }
      return response;
    }
  }

  // Subdomain kontrolü (gelecekte kullanım için)
  const subdomain = host.split('.')[0];
  if (subdomain && subdomain !== 'www' && subdomain !== 'localhost:3000') {
    // Subdomain ile gelen istekler
    const response = NextResponse.next();
    response.headers.set('x-tenant-slug', subdomain);
    return response;
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
