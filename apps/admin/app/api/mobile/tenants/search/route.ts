import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
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
      userType: string;
      tenantId?: string;
      customerId?: string;
      phone?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Search all tenants (for customers to find businesses)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only customers can search tenants
    if (auth.userType !== 'customer') {
      return NextResponse.json(
        { success: false, message: 'Bu işlem sadece müşteriler için' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Build where clause
    const whereClause: any = {
      status: 'active',
    };

    if (search.length >= 2) {
      whereClause.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where: whereClause,
      select: {
        id: true,
        businessName: true,
        slug: true,
        logo: true,
        phone: true,
        address: true,
      },
      orderBy: { businessName: 'asc' },
      take: 20, // Limit results
    });

    return NextResponse.json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    console.error('Search tenants error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
