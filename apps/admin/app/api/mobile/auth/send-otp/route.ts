import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

const NETGSM_API_URL = 'https://api.netgsm.com.tr/sms/send/otp';
const NETGSM_USERCODE = process.env.NETGSM_USERCODE;
const NETGSM_PASSWORD = process.env.NETGSM_PASSWORD;
const NETGSM_MSGHEADER = process.env.NETGSM_MSGHEADER;

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Telefon numarası gerekli' },
        { status: 400 }
      );
    }

    // Format phone number (remove leading 0 and add country code if needed)
    let formattedPhone = phone.replace(/\s/g, '').replace(/^0/, '');
    if (!formattedPhone.startsWith('90')) {
      formattedPhone = '90' + formattedPhone;
    }

    // Check if user exists in any tenant
    const customers = await prisma.customer.findMany({
      where: {
        phone: {
          contains: phone.replace(/^0/, '').slice(-10),
        },
      },
      select: { id: true, tenantId: true },
    });

    const staffMembers = await prisma.staff.findMany({
      where: {
        phone: {
          contains: phone.replace(/^0/, '').slice(-10),
        },
      },
      select: { id: true, tenantId: true },
    });

    const owners = await prisma.tenant.findMany({
      where: {
        ownerPhone: {
          contains: phone.replace(/^0/, '').slice(-10),
        },
      },
      select: { id: true },
    });

    // User must exist in at least one context
    if (customers.length === 0 && staffMembers.length === 0 && owners.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Bu telefon numarası ile kayıtlı kullanıcı bulunamadı' },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database with expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any existing OTP for this phone
    await prisma.otpVerification.deleteMany({
      where: { phone: formattedPhone },
    });

    // Create new OTP record
    const otpRecord = await prisma.otpVerification.create({
      data: {
        phone: formattedPhone,
        code: otpCode,
        purpose: 'mobile_login',
        expiresAt,
      },
    });

    // Send OTP via NetGSM
    const message = `Net Randevu dogrulama kodunuz: ${otpCode}. Bu kod 5 dakika gecerlidir.`;

    const netgsmResponse = await fetch(NETGSM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
        <mainbody>
          <header>
            <usercode>${NETGSM_USERCODE}</usercode>
            <password>${NETGSM_PASSWORD}</password>
            <msgheader>${NETGSM_MSGHEADER}</msgheader>
          </header>
          <body>
            <msg><![CDATA[${message}]]></msg>
            <no>${formattedPhone}</no>
          </body>
        </mainbody>`,
    });

    const responseText = await netgsmResponse.text();
    console.log('NetGSM Response:', responseText);

    // Check if SMS was sent successfully (NetGSM returns codes starting with 00 for success)
    if (!responseText.startsWith('00')) {
      console.error('NetGSM Error:', responseText);
      // In development, still return success for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode - OTP Code:', otpCode);
        return NextResponse.json({
          success: true,
          message: 'Doğrulama kodu gönderildi (DEV)',
          otpId: otpRecord.id,
        });
      }
      return NextResponse.json(
        { success: false, message: 'SMS gönderilemedi. Lütfen tekrar deneyin.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Doğrulama kodu gönderildi',
      otpId: otpRecord.id,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
