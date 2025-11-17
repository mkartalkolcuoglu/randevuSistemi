import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);
    const { packageId, packageSlug } = await request.json();

    // Tenant ve package bilgilerini al
    const [tenant, pkg] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: sessionData.tenantId },
        select: {
          id: true,
          businessName: true,
          ownerName: true,
          ownerEmail: true,
          phone: true,
        }
      }),
      prisma.subscriptionPackage.findUnique({
        where: { id: packageId },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          durationDays: true,
        }
      })
    ]);

    if (!tenant || !pkg) {
      return NextResponse.json({ error: 'Tenant or package not found' }, { status: 404 });
    }

    if (pkg.price === 0) {
      return NextResponse.json({ error: 'Use activate-free endpoint for free packages' }, { status: 400 });
    }

    // PayTR için merchant_oid oluştur (alfanumerik olmalı, özel karakter yok)
    const merchantOid = `SUB${tenant.id}${Date.now()}`;
    const paymentAmount = Math.round(pkg.price * 100); // TL to kuruş

    // Payment kaydı oluştur
    const payment = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        customerName: tenant.ownerName,
        customerEmail: tenant.ownerEmail,
        customerPhone: tenant.phone || '',
        merchantOid,
        amount: pkg.price,
        paymentAmount,
        currency: 'TL',
        status: 'pending',
        userBasket: `${pkg.name}, 1, ${pkg.price}`,
        userIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      }
    });

    // PayTR iframe token al
    const merchantId = process.env.PAYTR_MERCHANT_ID!;
    const merchantKey = process.env.PAYTR_MERCHANT_KEY!;
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT!;

    // Hash oluştur
    const hashStr = `${merchantId}${payment.userIp}${merchantOid}${tenant.ownerEmail}${paymentAmount}${payment.userBasket}no_installment0${payment.currency}1${merchantSalt}`;
    const paytrToken = crypto.createHmac('sha256', merchantKey).update(hashStr).digest('base64');

    // PayTR'ye istek at
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.netrandevu.com';
    const paytrResponse = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        merchant_id: merchantId,
        user_ip: payment.userIp,
        merchant_oid: merchantOid,
        email: tenant.ownerEmail,
        payment_amount: paymentAmount.toString(),
        paytr_token: paytrToken,
        user_basket: payment.userBasket,
        debug_on: process.env.PAYTR_TEST_MODE === 'true' ? '1' : '0',
        no_installment: '0',
        max_installment: '0',
        user_name: tenant.ownerName,
        user_address: tenant.businessName,
        user_phone: tenant.phone || '',
        merchant_ok_url: `${baseUrl}/admin/select-subscription/payment-success?package=${pkg.slug}&duration=${pkg.durationDays}`,
        merchant_fail_url: `${baseUrl}/admin/select-subscription/payment-failed`,
        timeout_limit: '30',
        currency: 'TL',
        test_mode: process.env.PAYTR_TEST_MODE === 'true' ? '1' : '0',
        lang: 'tr',
      }).toString()
    });

    const paytrText = await paytrResponse.text();
    console.log('PayTR Response:', paytrText);

    let paytrData;
    try {
      paytrData = JSON.parse(paytrText);
    } catch (e) {
      throw new Error(`PayTR invalid JSON response: ${paytrText}`);
    }

    if (paytrData.status === 'success') {
      // Payment kaydını güncelle
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paytrToken: paytrData.token,
        }
      });

      return NextResponse.json({
        success: true,
        iframeToken: paytrData.token,
        merchantOid,
      });
    } else {
      throw new Error(paytrData.reason || 'PayTR token error');
    }
  } catch (error: any) {
    console.error('Error initiating subscription payment:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
