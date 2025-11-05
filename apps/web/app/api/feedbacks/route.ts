import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      appointmentId,
      customerName,
      customerPhone,
      rating,
      comment,
      serviceName,
      staffName,
      appointmentDate
    } = body;

    // Validasyon
    if (!appointmentId || !customerName || !customerPhone || !rating) {
      return NextResponse.json(
        { success: false, error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz puan' },
        { status: 400 }
      );
    }

    // Randevuyu kontrol et ve tenantId'yi al
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Randevu tamamlanmış mı?
    if (appointment.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Sadece tamamlanmış randevular için geri bildirim verilebilir' },
        { status: 400 }
      );
    }

    // Zaten feedback verilmiş mi?
    const existingFeedback = await prisma.feedback.findUnique({
      where: { appointmentId }
    });

    if (existingFeedback) {
      return NextResponse.json(
        { success: false, error: 'Bu randevu için zaten geri bildirim verilmiş' },
        { status: 400 }
      );
    }

    // 7 gün kontrolü
    const appointmentDateTime = new Date(appointmentDate);
    const daysPassed = Math.floor((new Date().getTime() - appointmentDateTime.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysPassed > 7) {
      return NextResponse.json(
        { success: false, error: 'Geri bildirim süresi doldu (7 gün)' },
        { status: 400 }
      );
    }

    // Feedback oluştur
    const feedback = await prisma.feedback.create({
      data: {
        tenantId: appointment.tenantId,
        appointmentId,
        customerName,
        customerPhone,
        rating,
        comment: comment || null,
        serviceName,
        staffName,
        appointmentDate
      }
    });

    console.log(`✅ Feedback created for appointment ${appointmentId}`);

    return NextResponse.json({
      success: true,
      data: feedback,
      message: 'Geri bildiriminiz kaydedildi'
    });

  } catch (error) {
    console.error('❌ Error creating feedback:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Geri bildirim kaydedilirken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Tenant'a göre feedbackleri getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'TenantId gereklidir' },
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

