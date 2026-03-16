import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

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

// PUT - Update a blocked date
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId(request);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Oturum bulunamadı' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, startDate, endDate, staffId } = body;

    const existing = await prisma.blockedDate.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Kayıt bulunamadı' }, { status: 404 });
    }

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

    const updated = await prisma.blockedDate.update({
      where: { id },
      data: {
        title: title.trim(),
        startDate,
        endDate,
        staffId: staffId || null,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Update blocked date error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Bir hata oluştu' }, { status: 500 });
  }
}

// DELETE - Delete a blocked date
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId(request);
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Oturum bulunamadı' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.blockedDate.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Kayıt bulunamadı' }, { status: 404 });
    }

    await prisma.blockedDate.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Tatil günü silindi' });
  } catch (error: any) {
    console.error('Delete blocked date error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Bir hata oluştu' }, { status: 500 });
  }
}
