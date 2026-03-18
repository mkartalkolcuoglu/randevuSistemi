import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

const NETGSM_API_URL = 'https://api.netgsm.com.tr/sms/send/get';
const NETGSM_USERCODE = process.env.NETGSM_USERCODE;
const NETGSM_PASSWORD = process.env.NETGSM_PASSWORD;
const NETGSM_MSGHEADER = process.env.NETGSM_MSGHEADER;

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı gerekli' },
        { status: 400 }
      );
    }

    // Find tenant by username
    const tenant = await prisma.tenant.findFirst({
      where: { username: username.trim() },
      select: { id: true, phone: true, ownerName: true },
    });

    if (!tenant || !tenant.phone) {
      return NextResponse.json(
        { success: false, message: 'Bu kullanıcı adı ile kayıtlı hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Format phone number
    let formattedPhone = tenant.phone.replace(/\s/g, '').replace(/^0/, '');
    if (!formattedPhone.startsWith('90')) {
      formattedPhone = '90' + formattedPhone;
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any existing password reset OTP for this phone
    await prisma.otpVerification.deleteMany({
      where: { phone: formattedPhone, purpose: 'password_reset' },
    });

    // Create new OTP record
    await prisma.otpVerification.create({
      data: {
        phone: formattedPhone,
        code: otpCode,
        purpose: 'password_reset',
        expiresAt,
      },
    });

    // Send OTP via NetGSM
    const message = `Net Randevu sifre sifirlama kodunuz: ${otpCode}. Bu kod 5 dakika gecerlidir.`;

    const smsUrl = new URL(NETGSM_API_URL);
    smsUrl.searchParams.set('usercode', NETGSM_USERCODE || '');
    smsUrl.searchParams.set('password', NETGSM_PASSWORD || '');
    smsUrl.searchParams.set('gsmno', formattedPhone);
    smsUrl.searchParams.set('message', message);
    smsUrl.searchParams.set('msgheader', NETGSM_MSGHEADER || '');

    const netgsmResponse = await fetch(smsUrl.toString());
    const responseText = await netgsmResponse.text();
    console.log('NetGSM Forgot Password Response:', responseText);

    const isSuccess = responseText.trim().startsWith('00') || responseText.includes('<code>00</code>');
    if (!isSuccess) {
      console.error('NetGSM Error:', responseText);
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode - OTP Code:', otpCode);
        return NextResponse.json({
          success: true,
          message: 'Doğrulama kodu gönderildi (DEV)',
          maskedPhone: '***' + formattedPhone.slice(-4),
        });
      }
      return NextResponse.json(
        { success: false, message: 'SMS gönderilemedi. Lütfen tekrar deneyin.' },
        { status: 500 }
      );
    }

    // Mask phone for response (show last 4 digits)
    const maskedPhone = '***' + formattedPhone.slice(-4);

    return NextResponse.json({
      success: true,
      message: `Doğrulama kodu ${maskedPhone} numarasına gönderildi`,
      maskedPhone,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
