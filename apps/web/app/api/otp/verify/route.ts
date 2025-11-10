import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { formatPhoneForSMS } from '../../../../lib/netgsm-client';

const MAX_ATTEMPTS = 3; // Maksimum deneme sayısı

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, purpose = 'appointment_query' } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası ve kod gereklidir' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneForSMS(phone);

    // En son gönderilen, henüz verify edilmemiş OTP'yi bul
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        phone: formattedPhone,
        purpose,
        verified: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçerli bir doğrulama kodu bulunamadı',
          code: 'OTP_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Süre kontrolü
    const now = new Date();
    if (now > otpRecord.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: 'Doğrulama kodunun süresi doldu. Lütfen yeni kod isteyin.',
          code: 'OTP_EXPIRED'
        },
        { status: 400 }
      );
    }

    // Deneme sayısı kontrolü
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maksimum deneme sayısına ulaştınız. Lütfen yeni kod isteyin.',
          code: 'MAX_ATTEMPTS_REACHED'
        },
        { status: 400 }
      );
    }

    // Kod kontrolü
    if (otpRecord.code !== code) {
      // Deneme sayısını artır
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: {
          attempts: {
            increment: 1
          }
        }
      });

      const remainingAttempts = MAX_ATTEMPTS - (otpRecord.attempts + 1);

      return NextResponse.json(
        {
          success: false,
          error: 'Hatalı doğrulama kodu',
          code: 'INVALID_CODE',
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0
        },
        { status: 400 }
      );
    }

    // Kod doğru! OTP'yi verify et
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        verified: true,
        verifiedAt: new Date()
      }
    });

    console.log('✅ OTP verified successfully:', {
      id: otpRecord.id,
      phone: formattedPhone,
      purpose
    });

    // Session token oluştur (opsiyonel - güvenlik için)
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      message: 'Doğrulama başarılı',
      sessionToken,
      phone: formattedPhone
    });

  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Doğrulama sırasında hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
