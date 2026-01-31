import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// Use regular SMS API instead of OTP API (OTP package not active on account)
const NETGSM_API_URL = 'https://api.netgsm.com.tr/sms/send/get';
const NETGSM_USERCODE = process.env.NETGSM_USERCODE;
const NETGSM_PASSWORD = process.env.NETGSM_PASSWORD;
const NETGSM_MSGHEADER = process.env.NETGSM_MSGHEADER;

// Demo account phone number for App Store review
const DEMO_PHONE = '5551234567';
const DEMO_PHONE_FORMATTED = '905551234567';

export async function POST(request: NextRequest) {
  try {
    const { phone, userType } = await request.json();

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

    // Demo account bypass for App Store review
    // Demo phone: 5551234567, OTP: 123456
    if (formattedPhone === DEMO_PHONE_FORMATTED || phone === DEMO_PHONE || phone === '0' + DEMO_PHONE) {
      console.log('📱 Demo account OTP request - skipping SMS, use code: 123456');

      // Store demo OTP in database
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await prisma.otpVerification.deleteMany({
        where: { phone: DEMO_PHONE_FORMATTED },
      });
      const otpRecord = await prisma.otpVerification.create({
        data: {
          phone: DEMO_PHONE_FORMATTED,
          code: '123456',
          purpose: 'mobile_login',
          expiresAt,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Doğrulama kodu gönderildi',
        otpId: otpRecord.id,
      });
    }

    // For customer login, skip user existence check (allow new customers to register)
    // For business login, require existing user
    if (userType !== 'customer') {
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

      // Check by tenant phone field (ownerPhone may not exist in older DBs)
      const owners = await prisma.tenant.findMany({
        where: {
          phone: {
            contains: phone.replace(/^0/, '').slice(-10),
          },
        },
        select: { id: true },
      });

      // User must exist in at least one context for business login
      if (customers.length === 0 && staffMembers.length === 0 && owners.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Bu telefon numarası ile kayıtlı kullanıcı bulunamadı' },
          { status: 404 }
        );
      }
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

    // Send OTP via NetGSM (using regular SMS API)
    const message = `Net Randevu dogrulama kodunuz: ${otpCode}. Bu kod 5 dakika gecerlidir.`;

    // Use GET API with query params
    const smsUrl = new URL(NETGSM_API_URL);
    smsUrl.searchParams.set('usercode', NETGSM_USERCODE || '');
    smsUrl.searchParams.set('password', NETGSM_PASSWORD || '');
    smsUrl.searchParams.set('gsmno', formattedPhone);
    smsUrl.searchParams.set('message', message);
    smsUrl.searchParams.set('msgheader', NETGSM_MSGHEADER || '');

    const netgsmResponse = await fetch(smsUrl.toString());
    const responseText = await netgsmResponse.text();
    console.log('NetGSM Response:', responseText);

    // Check if SMS was sent successfully (NetGSM returns codes starting with 00 for success)
    const isSuccess = responseText.trim().startsWith('00') || responseText.includes('<code>00</code>');
    if (!isSuccess) {
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
        { success: false, message: 'SMS gönderilemedi. Lütfen tekrar deneyin.', netgsmError: responseText },
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
