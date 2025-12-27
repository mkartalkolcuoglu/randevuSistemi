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
      staffId?: string;
      ownerId?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get feedbacks and performance stats
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only owners and staff can view feedbacks
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    // Fetch all feedbacks for the tenant
    const feedbacks = await prisma.feedback.findMany({
      where: {
        tenantId: auth.tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate stats
    const totalFeedbacks = feedbacks.length;

    // Rating distribution
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let totalRating = 0;

    feedbacks.forEach((feedback) => {
      const rating = feedback.rating as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
        totalRating += rating;
      }
    });

    const averageRating = totalFeedbacks > 0
      ? Math.round((totalRating / totalFeedbacks) * 10) / 10
      : 0;

    // Satisfaction rate (4 and 5 star ratings)
    const satisfiedCount = ratingDistribution[4] + ratingDistribution[5];
    const satisfactionRate = totalFeedbacks > 0
      ? Math.round((satisfiedCount / totalFeedbacks) * 100)
      : 0;

    // Staff performance based on feedbacks
    const staffPerformance: Map<string, { name: string; totalRating: number; count: number; feedbacks: number }> = new Map();

    feedbacks.forEach((feedback) => {
      if (feedback.staffName) {
        const existing = staffPerformance.get(feedback.staffName) || {
          name: feedback.staffName,
          totalRating: 0,
          count: 0,
          feedbacks: 0,
        };
        existing.totalRating += feedback.rating;
        existing.count++;
        existing.feedbacks++;
        staffPerformance.set(feedback.staffName, existing);
      }
    });

    const staffRatings = Array.from(staffPerformance.values())
      .map((staff) => ({
        name: staff.name,
        averageRating: Math.round((staff.totalRating / staff.count) * 10) / 10,
        feedbackCount: staff.feedbacks,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    // Service performance based on feedbacks
    const servicePerformance: Map<string, { name: string; totalRating: number; count: number }> = new Map();

    feedbacks.forEach((feedback) => {
      if (feedback.serviceName) {
        const existing = servicePerformance.get(feedback.serviceName) || {
          name: feedback.serviceName,
          totalRating: 0,
          count: 0,
        };
        existing.totalRating += feedback.rating;
        existing.count++;
        servicePerformance.set(feedback.serviceName, existing);
      }
    });

    const serviceRatings = Array.from(servicePerformance.values())
      .map((service) => ({
        name: service.name,
        averageRating: Math.round((service.totalRating / service.count) * 10) / 10,
        feedbackCount: service.count,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    // Recent feedbacks (limit to 50)
    const recentFeedbacks = feedbacks.slice(0, 50).map((feedback) => ({
      id: feedback.id,
      customerName: feedback.customerName,
      rating: feedback.rating,
      comment: feedback.comment,
      serviceName: feedback.serviceName,
      staffName: feedback.staffName,
      appointmentDate: feedback.appointmentDate,
      createdAt: feedback.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalFeedbacks,
          averageRating,
          satisfactionRate,
          ratingDistribution,
        },
        staffRatings,
        serviceRatings,
        recentFeedbacks,
      },
    });
  } catch (error: any) {
    console.error('Get feedbacks error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
