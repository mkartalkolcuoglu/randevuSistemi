import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { formatPhoneForSMS } from '../../../../lib/netgsm-client';
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'customer-session-secret-key';

function createSessionToken(phone: string): string {
  const payload = JSON.stringify({ phone, exp: Date.now() + 24 * 60 * 60 * 1000 }); // 24 saat
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64') + '.' + signature;
}

export function verifySessionToken(token: string): { phone: string } | null {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;
    const payload = Buffer.from(payloadB64, 'base64').toString();
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    if (signature !== expectedSig) return null;
    const data = JSON.parse(payload);
    if (data.exp < Date.now()) return null;
    return { phone: data.phone };
  } catch { return null; }
}

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

    // Güvenli session token oluştur ve HttpOnly cookie olarak set et
    const sessionToken = createSessionToken(formattedPhone);

    const response = NextResponse.json({
      success: true,
      message: 'Doğrulama başarılı',
      phone: formattedPhone,
    });

    response.cookies.set('customer-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 saat
      path: '/',
    });

    return response;

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
