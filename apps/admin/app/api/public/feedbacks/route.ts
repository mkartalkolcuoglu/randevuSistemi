import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
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

    // Memnuniyet oranı (4-5 yıldız)
    const satisfactionRate = totalFeedbacks > 0
      ? ((ratingDistribution[4] + ratingDistribution[5]) / totalFeedbacks * 100)
      : 0;

    // Personel bazlı puanlar
    const staffMap = new Map<string, { total: number; count: number; feedbacks: typeof feedbacks }>();
    feedbacks.forEach(f => {
      if (!f.staffName) return;
      const existing = staffMap.get(f.staffName) || { total: 0, count: 0, feedbacks: [] as typeof feedbacks };
      existing.total += f.rating;
      existing.count += 1;
      existing.feedbacks.push(f);
      staffMap.set(f.staffName, existing);
    });

    const staffRatings = Array.from(staffMap.entries())
      .map(([name, data]) => ({
        name,
        averageRating: Number((data.total / data.count).toFixed(1)),
        feedbackCount: data.count,
        recentFeedbacks: data.feedbacks.slice(0, 5).map(f => ({
          id: f.id,
          rating: f.rating,
          comment: f.comment,
          customerName: f.customerName,
          serviceName: f.serviceName,
          appointmentDate: f.appointmentDate,
          createdAt: f.createdAt,
        })),
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    // Hizmet bazlı puanlar
    const serviceMap = new Map<string, { total: number; count: number }>();
    feedbacks.forEach(f => {
      if (!f.serviceName) return;
      const existing = serviceMap.get(f.serviceName) || { total: 0, count: 0 };
      existing.total += f.rating;
      existing.count += 1;
      serviceMap.set(f.serviceName, existing);
    });

    const serviceRatings = Array.from(serviceMap.entries())
      .map(([name, data]) => ({
        name,
        averageRating: Number((data.total / data.count).toFixed(1)),
        feedbackCount: data.count,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    return NextResponse.json({
      success: true,
      data: {
        feedbacks,
        stats: {
          totalFeedbacks,
          averageRating: Number(averageRating.toFixed(1)),
          satisfactionRate: Number(satisfactionRate.toFixed(0)),
          ratingDistribution,
        },
        staffRatings,
        serviceRatings,
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

