import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * GET /api/mobile/customer/tenants
 * Müşterinin kayıtlı olduğu tüm işletmeleri getirir
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
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

    // Only for customers
    if (decoded.userType !== 'customer' || !decoded.customerId) {
      return NextResponse.json(
        { success: false, message: 'Bu endpoint sadece müşteriler içindir' },
        { status: 403 }
      );
    }

    // Get customer's phone
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.customerId },
      select: { phone: true }
    });

    if (!customer?.phone) {
      return NextResponse.json(
        { success: false, message: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Find all customer records with same phone
    const allCustomerRecords = await prisma.customer.findMany({
      where: { phone: customer.phone },
      select: {
        id: true,
        tenantId: true,
        firstName: true,
        lastName: true,
      }
    });

    // Get valid tenants
    const tenantIds = [...new Set(allCustomerRecords.map(c => c.tenantId))];
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: {
        id: true,
        businessName: true,
        slug: true,
        logo: true,
        phone: true,
        address: true,
      }
    });

    // Map customer IDs to tenants
    const tenantsWithCustomerId = tenants.map(tenant => {
      const customerRecord = allCustomerRecords.find(c => c.tenantId === tenant.id);
      return {
        ...tenant,
        customerId: customerRecord?.id,
      };
    });

    console.log('📱 [CUSTOMER TENANTS] Found tenants:', tenantsWithCustomerId.length);

    return NextResponse.json({
      success: true,
      data: tenantsWithCustomerId,
    });

  } catch (error: any) {
    console.error('❌ [CUSTOMER TENANTS] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
