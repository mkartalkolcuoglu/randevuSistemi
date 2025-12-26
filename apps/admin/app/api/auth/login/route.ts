import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Try to find tenant first (owner login)
    const tenant = await prisma.tenant.findFirst({
      where: {
        username: username,
        password: password,
        // Don't check status - middleware handles subscription
      },
      select: {
        id: true,
        businessName: true,
        slug: true,
        username: true,
        ownerName: true,
        ownerEmail: true,
        subscriptionEnd: true
      }
    });

    // If tenant found, proceed with tenant login
    if (tenant) {
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
        ownerName: tenant.ownerName || tenant.businessName,
        userType: 'owner',
        role: 'owner',
        subscriptionEnd: tenant.subscriptionEnd
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
        userType: 'owner',
        tenant: {
          id: tenant.id,
          businessName: tenant.businessName,
          slug: tenant.slug,
          ownerName: tenant.ownerName || tenant.businessName
        }
      });
    }

    // If no tenant found, try staff login
    const staff = await prisma.staff.findUnique({
      where: { username: username },
      select: {
        id: true,
        username: true,
        password: true,
        firstName: true,
        lastName: true,
        email: true,
        tenantId: true,
        status: true,
        canLogin: true,
        role: true,
        permissions: true
      }
    });

    // Check if staff exists and can login
    if (!staff || !staff.canLogin || staff.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, staff.password || '');
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Get tenant info
    const staffTenant = await prisma.tenant.findUnique({
      where: { id: staff.tenantId },
      select: {
        id: true,
        businessName: true,
        slug: true
      }
    });

    if (!staffTenant) {
      return NextResponse.json(
        { success: false, error: 'İşletme bulunamadı' },
        { status: 404 }
      );
    }

    // Update last login
    await prisma.staff.update({
      where: { id: staff.id },
      data: { lastLogin: new Date() }
    });

    // Parse permissions
    let permissions = null;
    if (staff.permissions) {
      try {
        permissions = JSON.parse(staff.permissions);
      } catch (e) {
        console.error('Error parsing permissions:', e);
      }
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('tenant-session', JSON.stringify({
      tenantId: staffTenant.id,
      businessName: staffTenant.businessName,
      slug: staffTenant.slug,
      ownerName: `${staff.firstName} ${staff.lastName}`,
      userType: 'staff',
      staffId: staff.id,
      role: staff.role,
      permissions: permissions
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Also set simple tenant ID cookie for API routes
    cookieStore.set('tenant_session', staffTenant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'Giriş başarılı',
      userType: 'staff',
      staff: {
        id: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        role: staff.role,
        permissions: permissions
      },
      tenant: {
        id: staffTenant.id,
        businessName: staffTenant.businessName,
        slug: staffTenant.slug
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Giriş işlemi sırasında hata oluştu', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
