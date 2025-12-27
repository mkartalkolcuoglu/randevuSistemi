import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token and get user info
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      phone: string;
      userType: string;
      tenantId: string;
      staffId?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get customers list (staff/owner only)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can view customer list
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause: any = { tenantId: auth.tenantId };

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    const formattedCustomers = customers.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      birthDate: c.birthDate,
      gender: c.gender,
      address: c.address,
      notes: c.notes,
      status: c.status,
      isBlacklisted: c.isBlacklisted,
      noShowCount: c.noShowCount,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedCustomers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Create new customer (staff/owner only)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can create customers
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, email, birthDate, gender, address, notes, status, whatsappNotifications } = body;

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { success: false, message: 'Ad, soyad ve telefon gerekli' },
        { status: 400 }
      );
    }

    // Check if customer with same phone exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        tenantId: auth.tenantId,
        phone,
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, message: 'Bu telefon numarası ile kayıtlı müşteri var' },
        { status: 400 }
      );
    }

    // Parse birthDate if provided
    let parsedBirthDate = null;
    if (birthDate) {
      try {
        parsedBirthDate = new Date(birthDate);
      } catch (e) {
        console.error('Error parsing birthDate:', e);
      }
    }

    // Generate a unique placeholder email if not provided (to avoid unique constraint issues)
    const customerEmail = email && email.trim()
      ? email.trim()
      : `noemail_${Date.now()}_${Math.random().toString(36).substring(7)}@placeholder.local`;

    const customer = await prisma.customer.create({
      data: {
        tenantId: auth.tenantId,
        firstName,
        lastName,
        phone,
        email: customerEmail,
        birthDate: parsedBirthDate,
        gender: gender || null,
        address: address || null,
        notes: notes || null,
        status: status || 'active',
        isBlacklisted: false,
        noShowCount: 0,
        whatsappNotifications: whatsappNotifications !== false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Müşteri oluşturuldu',
      data: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
      },
    });
  } catch (error: any) {
    console.error('Create customer error:', error);

    // Check for unique constraint violation
    if (error?.code === 'P2002') {
      const target = error?.meta?.target;
      if (target?.includes('email')) {
        return NextResponse.json(
          { success: false, message: 'Bu e-posta adresi ile kayıtlı müşteri var' },
          { status: 400 }
        );
      }
      if (target?.includes('phone')) {
        return NextResponse.json(
          { success: false, message: 'Bu telefon numarası ile kayıtlı müşteri var' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
