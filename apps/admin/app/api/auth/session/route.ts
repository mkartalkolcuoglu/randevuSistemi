import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '../../../../lib/sqlite';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant_session');

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    const tenantId = sessionCookie.value;
    const tenant = db.prepare('SELECT id, businessName, slug, ownerName FROM tenants WHERE id = ?').get(tenantId) as any;

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz oturum' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session: tenant
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { success: false, error: 'Oturum doğrulama hatası' },
      { status: 500 }
    );
  }
}
