import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('tenant-session');

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    const tenantId = session.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID not found in session' },
        { status: 400 }
      );
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    // İstatistikleri hesapla
    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks
      : 0;

    // Yıldız dağılımı
    const ratingDistribution = {
      5: feedbacks.filter(f => f.rating === 5).length,
      4: feedbacks.filter(f => f.rating === 4).length,
      3: feedbacks.filter(f => f.rating === 3).length,
      2: feedbacks.filter(f => f.rating === 2).length,
      1: feedbacks.filter(f => f.rating === 1).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        feedbacks,
        stats: {
          totalFeedbacks,
          averageRating: Number(averageRating.toFixed(1)),
          ratingDistribution
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching feedbacks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Geri bildirimler getirilirken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

