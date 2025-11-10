import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * OTP Cleanup Cron Job
 * Expired OTP kayıtlarını temizler
 * Vercel Cron ile günde 1 kez çalışır
 */
export async function GET(request: NextRequest) {
  try {
    // CRON_SECRET ile güvenlik kontrolü
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('❌ CRON_SECRET environment variable not set');
      return NextResponse.json(
        { success: false, error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧹 Starting OTP cleanup job...');

    const now = new Date();

    // 1. Süresi dolmuş OTP'leri sil (expiresAt < now)
    const deleteExpired = await prisma.otpVerification.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });

    // 2. Doğrulanmış ve 24 saatten eski OTP'leri sil
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const deleteOldVerified = await prisma.otpVerification.deleteMany({
      where: {
        verified: true,
        verifiedAt: {
          lt: oneDayAgo
        }
      }
    });

    // 3. 7 günden eski tüm OTP'leri sil (güvenlik için)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const deleteOldAll = await prisma.otpVerification.deleteMany({
      where: {
        createdAt: {
          lt: sevenDaysAgo
        }
      }
    });

    const totalDeleted = deleteExpired.count + deleteOldVerified.count + deleteOldAll.count;

    console.log('✅ OTP cleanup completed:', {
      expiredDeleted: deleteExpired.count,
      oldVerifiedDeleted: deleteOldVerified.count,
      oldAllDeleted: deleteOldAll.count,
      totalDeleted
    });

    return NextResponse.json({
      success: true,
      message: 'OTP cleanup completed',
      stats: {
        expiredDeleted: deleteExpired.count,
        oldVerifiedDeleted: deleteOldVerified.count,
        oldAllDeleted: deleteOldAll.count,
        totalDeleted
      }
    });

  } catch (error) {
    console.error('❌ Error in OTP cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'OTP cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
