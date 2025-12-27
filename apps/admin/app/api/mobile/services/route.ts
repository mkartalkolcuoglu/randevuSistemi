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
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get services
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const services = await prisma.service.findMany({
      where: {
        tenantId: auth.tenantId,
        status: 'active',
      },
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
      isActive: service.status === 'active',
    }));

    return NextResponse.json({
      success: true,
      data: formattedServices,
    });
  } catch (error: any) {
    console.error('Get services error:', error?.message || error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
