import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const { packageSlug, durationDays } = await request.json();

    // Tenant bilgisini al
    const tenant = await prisma.tenant.findUnique({
      where: { id: sessionData.tenantId },
      select: {
        id: true,
        hasUsedTrial: true,
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Eğer trial paketiyse ve daha önce kullanılmışsa hata ver
    if (packageSlug === 'trial' && tenant.hasUsedTrial) {
      return NextResponse.json({ error: 'Trial package already used' }, { status: 400 });
    }

    // Subscription tarihlerini hesapla
    const now = new Date();
    const subscriptionEnd = new Date(now);
    subscriptionEnd.setDate(subscriptionEnd.getDate() + durationDays);

    // Tenant'ı güncelle
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionPlan: packageSlug,
        subscriptionStart: now,
        subscriptionEnd: subscriptionEnd,
        hasUsedTrial: packageSlug === 'trial' ? true : tenant.hasUsedTrial,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Package activated successfully',
      subscriptionEnd,
    });
  } catch (error) {
    console.error('Error activating free package:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
