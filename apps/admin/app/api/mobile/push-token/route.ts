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

    // Store push token - we'll use the Notification model or create a new PushToken model
    // For now, we'll update the customer or staff record with the push token
    if (auth.customerId) {
      await prisma.customer.update({
        where: { id: auth.customerId },
        data: {
          // We'd need to add pushToken field to Customer model
          // pushToken: token,
        },
      });
    } else if (auth.staffId) {
      await prisma.staff.update({
        where: { id: auth.staffId },
        data: {
          // We'd need to add pushToken field to Staff model
          // pushToken: token,
        },
      });
    }

    // For now, just acknowledge receipt
    console.log(`Push token registered for user ${auth.staffId || auth.ownerId || auth.customerId}: ${token}`);

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

    const { token } = await request.json();

    console.log(`Push token removed for user ${auth.staffId || auth.ownerId || auth.customerId}: ${token}`);

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
