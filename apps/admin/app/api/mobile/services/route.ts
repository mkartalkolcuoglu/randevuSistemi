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

// GET - Get services (staff/owner only with all statuses, customers get only active)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    // Build where clause
    let whereClause: any = { tenantId: auth.tenantId };

    // If customer or not requesting inactive, only show active
    if (auth.userType === 'customer' || !includeInactive) {
      whereClause.status = 'active';
    } else if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const formattedServices = services.map((service) => ({
      id: service.id,
      tenantId: service.tenantId,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      status: service.status,
      isActive: service.status === 'active',
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedServices,
    });
  } catch (error: any) {
    console.error('Get services error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new service (staff/owner only)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can create services
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, price, duration, category, isActive } = body;

    if (!name || price === undefined || !duration) {
      return NextResponse.json(
        { success: false, message: 'Hizmet adı, fiyat ve süre zorunludur' },
        { status: 400 }
      );
    }

    // Validate price and duration
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz fiyat değeri' },
        { status: 400 }
      );
    }

    if (typeof duration !== 'number' || duration < 5) {
      return NextResponse.json(
        { success: false, message: 'Süre en az 5 dakika olmalıdır' },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        tenantId: auth.tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        price,
        duration,
        category: category?.trim() || null,
        status: isActive !== false ? 'active' : 'inactive',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Hizmet oluşturuldu',
      data: {
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        category: service.category,
        status: service.status,
        isActive: service.status === 'active',
      },
    });
  } catch (error: any) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
