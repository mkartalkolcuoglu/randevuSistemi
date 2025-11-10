import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { generateOtpCode, sendOtpSMS, formatPhoneForSMS } from '../../../../lib/netgsm-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, purpose = 'appointment_query', tenantId } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gereklidir' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneForSMS(phone);

    // Rate limiting: Son 1 dakika içinde aynı numara için OTP gönderilmiş mi kontrol et
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await prisma.otpVerification.findFirst({
      where: {
        phone: formattedPhone,
        purpose,
        createdAt: {
          gte: oneMinuteAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (recentOtp) {
      const secondsLeft = Math.ceil((recentOtp.createdAt.getTime() + 60000 - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Lütfen ${secondsLeft} saniye sonra tekrar deneyin`,
          retryAfter: secondsLeft
        },
        { status: 429 }
      );
    }

    // 6 haneli OTP kodu üret
    const code = generateOtpCode();

    // OTP'yi veritabanına kaydet (120 saniye geçerli)
    const expiresAt = new Date(Date.now() + 120 * 1000);
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const otpRecord = await prisma.otpVerification.create({
      data: {
        id: `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phone: formattedPhone,
        code,
        purpose,
        tenantId,
        expiresAt,
        ipAddress: ipAddress.split(',')[0].trim() // İlk IP'yi al
      }
    });

    console.log('🔐 OTP created:', {
      id: otpRecord.id,
      phone: formattedPhone,
      purpose,
      expiresAt
    });

    // SMS gönder
    const purposeText = purpose === 'appointment_query'
      ? 'randevu sorgulama'
      : purpose === 'subscription'
      ? 'yeni abonelik'
      : 'dogrulama';

    const smsResult = await sendOtpSMS({
      to: formattedPhone,
      code,
      purpose: purposeText
    });

    if (!smsResult.success) {
      // SMS gönderilemedi, OTP kaydını sil
      await prisma.otpVerification.delete({
        where: { id: otpRecord.id }
      });

      return NextResponse.json(
        {
          success: false,
          error: 'SMS gönderilemedi. Lütfen tekrar deneyin.',
          details: smsResult.error
        },
        { status: 500 }
      );
    }

    console.log('✅ OTP SMS sent successfully:', {
      phone: formattedPhone,
      bulkId: smsResult.bulkId
    });

    return NextResponse.json({
      success: true,
      message: 'Doğrulama kodu gönderildi',
      expiresIn: 120, // saniye
      otpId: otpRecord.id
    });

  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'OTP gönderilirken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
