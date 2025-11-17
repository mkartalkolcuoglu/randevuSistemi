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
        // Trial paketiyse hasUsedTrial'ı true yap
        hasUsedTrial: packageSlug === 'trial' ? true : tenant.hasUsedTrial,
      }
    });

    // Cookie'yi güncelle (subscriptionEnd'i yeni tarihle)
    const updatedSessionData = {
      ...sessionData,
      subscriptionEnd: subscriptionEnd.toISOString(),
    };

    cookieStore.set('tenant-session', JSON.stringify(updatedSessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'Package activated successfully',
      subscriptionEnd,
    });
  } catch (error) {
    console.error('Error activating paid package:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
