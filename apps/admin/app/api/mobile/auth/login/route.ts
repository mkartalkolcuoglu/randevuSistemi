import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    console.log('🔐 Login attempt:', username);

    // First, check if it's a staff member
    const staff = await prisma.staff.findFirst({
      where: {
        OR: [
          { email: username.toLowerCase() },
          { username: username.toLowerCase() },
        ],
        status: 'active',
      },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
      },
    });

    if (staff && staff.password) {
      // Check password
      const isValid = await bcrypt.compare(password, staff.password);

      if (isValid) {
        const user = {
          id: staff.id,
          phone: staff.phone || '',
          userType: 'staff' as const,
          tenantId: staff.tenantId,
          tenantName: staff.tenant.businessName,
          staffId: staff.id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
        };

        const token = jwt.sign(
          {
            staffId: staff.id,
            userType: 'staff',
            tenantId: staff.tenantId,
          },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        console.log('✅ Staff login successful:', staff.email);

        return NextResponse.json({
          success: true,
          message: 'Giriş başarılı',
          user,
          token,
        });
      }
    }

    // Check if it's a tenant owner (using username or ownerEmail)
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { ownerEmail: username.toLowerCase() },
          { slug: username.toLowerCase() },
        ],
      },
    });

    if (tenant && tenant.password) {
      const isValid = await bcrypt.compare(password, tenant.password);

      if (isValid) {
        const user = {
          id: tenant.id,
          phone: tenant.phone || '',
          userType: 'owner' as const,
          tenantId: tenant.id,
          tenantName: tenant.businessName,
          firstName: tenant.ownerName?.split(' ')[0] || '',
          lastName: tenant.ownerName?.split(' ').slice(1).join(' ') || '',
          email: tenant.ownerEmail,
        };

        const token = jwt.sign(
          {
            ownerId: tenant.id,
            userType: 'owner',
            tenantId: tenant.id,
          },
          JWT_SECRET,
          { expiresIn: '30d' }
        );

        console.log('✅ Owner login successful:', tenant.ownerEmail);

        return NextResponse.json({
          success: true,
          message: 'Giriş başarılı',
          user,
          token,
        });
      }
    }

    // Invalid credentials
    console.log('❌ Login failed: Invalid credentials for', username);
    return NextResponse.json(
      { success: false, message: 'Kullanıcı adı veya şifre hatalı' },
      { status: 401 }
    );

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
