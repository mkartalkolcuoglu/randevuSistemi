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

// GET - Get staff list
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
    const serviceId = searchParams.get('serviceId');

    let staff;

    if (serviceId) {
      // Get staff that can perform the service
      staff = await prisma.staff.findMany({
        where: {
          tenantId: auth.tenantId,
          isActive: true,
          services: {
            some: {
              id: serviceId,
            },
          },
        },
        orderBy: { firstName: 'asc' },
      });
    } else {
      staff = await prisma.staff.findMany({
        where: {
          tenantId: auth.tenantId,
          isActive: true,
        },
        orderBy: { firstName: 'asc' },
      });
    }

    const formattedStaff = staff.map((s) => ({
      id: s.id,
      tenantId: s.tenantId,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phone: s.phone,
      position: s.position,
      avatar: s.avatar,
      isActive: s.isActive,
    }));

    return NextResponse.json({
      success: true,
      data: formattedStaff,
    });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
