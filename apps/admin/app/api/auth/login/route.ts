import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Find tenant by username and password
    const tenant = await prisma.tenant.findFirst({
      where: {
        username: username,
        password: password,
        status: 'active'
      },
      select: {
        id: true,
        businessName: true,
        slug: true,
        username: true,
        ownerName: true,
        ownerEmail: true
      }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { lastLogin: new Date() }
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('tenant-session', JSON.stringify({
      tenantId: tenant.id,
      businessName: tenant.businessName,
      slug: tenant.slug,
      ownerName: tenant.ownerName || tenant.businessName
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Also set simple tenant ID cookie for API routes
    cookieStore.set('tenant_session', tenant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'Giriş başarılı',
      tenant: {
        id: tenant.id,
        businessName: tenant.businessName,
        slug: tenant.slug,
        ownerName: tenant.ownerName || tenant.businessName
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
