import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as {
      userType: string;
      tenantId: string;
      staffId?: string;
    };
  } catch {
    return null;
  }
}

// GET - List blocked dates (all authenticated users)
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    let tenantId: string | null = null;

    if (auth) {
      tenantId = auth.userType === 'customer'
        ? request.headers.get('X-Tenant-ID')
        : auth.tenantId;
    } else {
      // Public mode
      tenantId = request.headers.get('X-Tenant-ID');
    }

    if (!tenantId) {
      return NextResponse.json({ success: false, message: 'Tenant ID gerekli' }, { status: 400 });
    }

    const blockedDates = await prisma.blockedDate.findMany({
      where: { tenantId },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ success: true, data: blockedDates });
  } catch (error: any) {
    console.error('Get blocked dates error:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu' }, { status: 500 });
  }
}

// POST - Create blocked date (staff/owner only)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || auth.userType === 'customer') {
      return NextResponse.json({ success: false, message: 'Yetki gerekli' }, { status: 403 });
    }

    const body = await request.json();
    const { title, startDate, endDate, staffId } = body;

    if (!title?.trim() || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Başlık, başlangıç ve bitiş tarihi zorunludur' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, message: 'Başlangıç tarihi bitiş tarihinden sonra olamaz' },
        { status: 400 }
      );
    }

    const blockedDate = await prisma.blockedDate.create({
      data: {
        tenantId: auth.tenantId,
        title: title.trim(),
        startDate,
        endDate,
        staffId: staffId || null,
      },
    });

    return NextResponse.json({ success: true, data: blockedDate });
  } catch (error: any) {
    console.error('Create blocked date error:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu' }, { status: 500 });
  }
}

// DELETE - Delete blocked date (staff/owner only)
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth || auth.userType === 'customer') {
      return NextResponse.json({ success: false, message: 'Yetki gerekli' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID gerekli' }, { status: 400 });
    }

    const existing = await prisma.blockedDate.findFirst({
      where: { id, tenantId: auth.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Kayıt bulunamadı' }, { status: 404 });
    }

    await prisma.blockedDate.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Tatil günü silindi' });
  } catch (error: any) {
    console.error('Delete blocked date error:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu' }, { status: 500 });
  }
}
