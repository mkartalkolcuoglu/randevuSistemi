import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Token gerekli' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz token' },
        { status: 401 }
      );
    }

    // Check if it's a staff or owner token
    if (decoded.staffId) {
      // Staff token
      const staff = await prisma.staff.findFirst({
        where: {
          id: decoded.staffId,
          status: 'active',
          canLogin: true,
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

      if (!staff) {
        return NextResponse.json(
          { success: false, message: 'Personel bulunamadı' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: staff.id,
          phone: staff.phone || '',
          userType: 'staff',
          tenantId: staff.tenantId,
          tenantName: staff.tenant.businessName,
          staffId: staff.id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
        },
      });
    } else if (decoded.ownerId) {
      // Owner token
      const tenant = await prisma.tenant.findUnique({
        where: { id: decoded.ownerId },
      });

      if (!tenant) {
        return NextResponse.json(
          { success: false, message: 'İşletme bulunamadı' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: tenant.id,
          phone: tenant.phone || '',
          userType: 'owner',
          tenantId: tenant.id,
          tenantName: tenant.businessName,
          firstName: tenant.ownerName?.split(' ')[0] || '',
          lastName: tenant.ownerName?.split(' ').slice(1).join(' ') || '',
          email: tenant.ownerEmail,
        },
      });
    } else if (decoded.customerId) {
      // Customer token
      const customer = await prisma.customer.findUnique({
        where: { id: decoded.customerId },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, message: 'Müşteri bulunamadı' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: customer.id,
          phone: customer.phone || '',
          userType: 'customer',
          tenantId: decoded.tenantId,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Geçersiz token yapısı' },
      { status: 401 }
    );

  } catch (error: any) {
    console.error('Token validation error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Token doğrulama hatası', error: error?.message },
      { status: 500 }
    );
  }
}
