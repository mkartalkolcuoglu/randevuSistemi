import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userType: string;
      tenantId: string;
      customerId?: string;
      staffId?: string;
      ownerId?: string;
      phone?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// POST - Register push token
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token gerekli' },
        { status: 400 }
      );
    }

    if (auth.customerId) {
      // Get customer phone to update all records across tenants
      const customer = await prisma.customer.findUnique({
        where: { id: auth.customerId },
        select: { phone: true },
      });

      if (customer?.phone) {
        await prisma.customer.updateMany({
          where: { phone: customer.phone },
          data: { expoPushToken: token },
        });
      } else {
        await prisma.customer.update({
          where: { id: auth.customerId },
          data: { expoPushToken: token },
        });
      }
    }

    console.log(`✅ Push token registered for ${auth.customerId || auth.staffId || auth.ownerId}`);

    return NextResponse.json({
      success: true,
      message: 'Push token kaydedildi',
    });
  } catch (error) {
    console.error('Register push token error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Remove push token
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    if (auth.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: auth.customerId },
        select: { phone: true },
      });

      if (customer?.phone) {
        await prisma.customer.updateMany({
          where: { phone: customer.phone },
          data: { expoPushToken: null },
        });
      }
    }

    console.log(`🗑️ Push token removed for ${auth.customerId || auth.staffId || auth.ownerId}`);

    return NextResponse.json({
      success: true,
      message: 'Push token silindi',
    });
  } catch (error) {
    console.error('Remove push token error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
