import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as {
      userType: string;
      customerId?: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

// GET - Get customer notification preferences
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || auth.userType !== 'customer') {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: auth.customerId },
      select: {
        whatsappNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        whatsappNotifications: customer.whatsappNotifications ?? true,
        smsNotifications: customer.smsNotifications ?? true,
        pushNotifications: customer.pushNotifications ?? true,
      },
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Update customer notification preferences
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || auth.userType !== 'customer') {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { whatsappNotifications, smsNotifications, pushNotifications } = body;

    const customer = await prisma.customer.findUnique({
      where: { id: auth.customerId },
      select: { phone: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    const updateData: Record<string, boolean> = {};
    if (whatsappNotifications !== undefined) updateData.whatsappNotifications = whatsappNotifications;
    if (smsNotifications !== undefined) updateData.smsNotifications = smsNotifications;
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;

    // Update all customer records with the same phone number
    await prisma.customer.updateMany({
      where: { phone: customer.phone },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Bildirim tercihleri güncellendi',
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
