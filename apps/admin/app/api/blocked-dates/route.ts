import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

async function getTenantId(request: NextRequest): Promise<string | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('tenant-session');
  if (!sessionCookie) return null;
  try {
    const sessionData = JSON.parse(sessionCookie.value);
    return sessionData.tenantId || null;
  } catch {
    return null;
  }
}

// GET - List blocked dates for the tenant
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Oturum bulunamadı' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: any = { tenantId };
    if (from) where.endDate = { gte: from };
    if (to) where.startDate = { ...(where.startDate || {}), lte: to };

    const blockedDates = await prisma.blockedDate.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ success: true, data: blockedDates });
  } catch (error: any) {
    console.error('Get blocked dates error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Bir hata oluştu' }, { status: 500 });
  }
}

// POST - Create a new blocked date
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Oturum bulunamadı' }, { status: 401 });
    }

    const body = await request.json();
    const { title, startDate, endDate, staffId } = body;

    if (!title?.trim() || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Başlık, başlangıç ve bitiş tarihi zorunludur' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, error: 'Başlangıç tarihi bitiş tarihinden sonra olamaz' },
        { status: 400 }
      );
    }

    const blockedDate = await prisma.blockedDate.create({
      data: {
        tenantId,
        title: title.trim(),
        startDate,
        endDate,
        staffId: staffId || null,
      },
    });

    return NextResponse.json({ success: true, data: blockedDate });
  } catch (error: any) {
    console.error('Create blocked date error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Bir hata oluştu' }, { status: 500 });
  }
}
