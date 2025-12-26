import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
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
        { success: false, message: 'Geçersiz veya süresi dolmuş oturum' },
        { status: 401 }
      );
    }

    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Salon ID gerekli' },
        { status: 400 }
      );
    }

    const phone = decoded.phone;
    const phoneLastDigits = phone.replace(/^90/, '').slice(-10);

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        businessName: true,
        slug: true,
        logo: true,
        primaryColor: true,
        ownerPhone: true,
        ownerName: true,
        ownerEmail: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, message: 'Salon bulunamadı' },
        { status: 404 }
      );
    }

    // Check if user is owner
    const isOwner = tenant.ownerPhone?.includes(phoneLastDigits);

    // Check if user is staff
    const staff = await prisma.staff.findFirst({
      where: {
        tenantId,
        phone: {
          contains: phoneLastDigits,
        },
      },
    });

    // Check if user is customer
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId,
        phone: {
          contains: phoneLastDigits,
        },
      },
    });

    let userType: 'owner' | 'staff' | 'customer';
    let userId: string;
    let firstName: string | undefined;
    let lastName: string | undefined;
    let email: string | undefined;
    let customerId: string | undefined;
    let staffId: string | undefined;

    if (isOwner) {
      userType = 'owner';
      userId = tenant.id;
      firstName = tenant.ownerName?.split(' ')[0];
      lastName = tenant.ownerName?.split(' ').slice(1).join(' ');
      email = tenant.ownerEmail || undefined;
    } else if (staff) {
      userType = 'staff';
      userId = staff.id;
      staffId = staff.id;
      firstName = staff.firstName;
      lastName = staff.lastName;
      email = staff.email;
    } else if (customer) {
      userType = 'customer';
      userId = customer.id;
      customerId = customer.id;
      firstName = customer.firstName;
      lastName = customer.lastName;
      email = customer.email;
    } else {
      return NextResponse.json(
        { success: false, message: 'Bu salona erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    // Generate new token with tenant info
    const newToken = jwt.sign(
      {
        phone,
        userType,
        tenantId: tenant.id,
        customerId,
        staffId,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const user = {
      id: userId,
      phone,
      userType,
      tenantId: tenant.id,
      tenantName: tenant.businessName,
      customerId,
      staffId,
      firstName,
      lastName,
      email,
    };

    return NextResponse.json({
      success: true,
      message: 'Salon seçildi',
      user,
      token: newToken,
      tenant: {
        id: tenant.id,
        businessName: tenant.businessName,
        slug: tenant.slug,
        logo: tenant.logo,
        primaryColor: tenant.primaryColor,
      },
    });
  } catch (error) {
    console.error('Select tenant error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
