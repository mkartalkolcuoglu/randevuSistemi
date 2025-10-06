import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/sqlite';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Find tenant by username and password
    const tenant = db.prepare(`
      SELECT id, businessName, slug, username, COALESCE(ownerName, businessName) as ownerName, ownerEmail 
      FROM tenants 
      WHERE username = ? AND password = ? AND status = 'active'
    `).get(username, password);

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Update last login
    db.prepare(`
      UPDATE tenants 
      SET lastLogin = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run((tenant as any).id);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('tenant-session', JSON.stringify({
      tenantId: (tenant as any).id,
      businessName: (tenant as any).businessName,
      slug: (tenant as any).slug,
      ownerName: (tenant as any).ownerName
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Also set simple tenant ID cookie for API routes
    cookieStore.set('tenant_session', (tenant as any).id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'Giriş başarılı',
      tenant: {
        id: (tenant as any).id,
        businessName: (tenant as any).businessName,
        slug: (tenant as any).slug,
        ownerName: (tenant as any).ownerName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Giriş işlemi sırasında hata oluştu' },
      { status: 500 }
    );
  }
}
