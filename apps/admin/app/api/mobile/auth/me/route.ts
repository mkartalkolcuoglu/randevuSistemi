import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { OWNER_PERMISSIONS } from '../../../../../lib/permissions';

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
          permissions: staff.permissions ? JSON.parse(staff.permissions as string) : null,
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
          permissions: OWNER_PERMISSIONS,
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
    } else if (decoded.userType === 'customer' && decoded.isNewCustomer) {
      // New customer token (not yet registered)
      return NextResponse.json({
        success: true,
        user: {
          id: null,
          phone: decoded.phone || '',
          userType: 'customer',
          tenantId: null,
          firstName: null,
          lastName: null,
          email: null,
          isNewCustomer: true,
        },
      });
    } else if (decoded.userType === 'customer' && decoded.isDemo) {
      // Demo customer token (for App Store review)
      // Try to find demo customer if customerId exists
      if (decoded.customerId) {
        const customer = await prisma.customer.findUnique({
          where: { id: decoded.customerId },
        });

        if (customer) {
          return NextResponse.json({
            success: true,
            user: {
              id: customer.id,
              phone: customer.phone || decoded.phone || '',
              userType: 'customer',
              tenantId: null,
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              isDemo: true,
            },
          });
        }
      }

      // Demo customer without database record
      return NextResponse.json({
        success: true,
        user: {
          id: null,
          phone: decoded.phone || '',
          userType: 'customer',
          tenantId: null,
          firstName: 'Demo',
          lastName: 'Müşteri',
          email: 'demo@netrandevu.com',
          isDemo: true,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: 'Geçersiz token yapısı' },
      { status: 401 }
    );

  } catch (error: any) {
    console.error('Get user error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
