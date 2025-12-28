import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { initiatePayment, logPayTRConfig } from '../../../../../lib/paytr-client';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userType: string;
      tenantId?: string;
      customerId?: string;
      phone?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

/**
 * Mobile Payment Initiate API
 *
 * POST /api/mobile/payment/initiate
 *
 * Body:
 * {
 *   tenantId: string;
 *   serviceId: string;
 *   serviceName: string;
 *   amount: number;
 *   appointmentData?: {...};
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('💳 [MOBILE PAYMENT] Initiate request received');

    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    if (auth.userType !== 'customer') {
      return NextResponse.json(
        { success: false, message: 'Bu işlem sadece müşteriler için' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      tenantId,
      serviceId,
      serviceName,
      amount,
      appointmentData
    } = body;

    // Validasyon
    if (!tenantId || !serviceName || !amount) {
      return NextResponse.json(
        {
          success: false,
          message: 'Gerekli alanlar eksik: tenantId, serviceName, amount'
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Geçersiz tutar'
        },
        { status: 400 }
      );
    }

    // Get customer info
    const customer = await prisma.customer.findUnique({
      where: { id: auth.customerId },
      select: { id: true, firstName: true, lastName: true, phone: true, email: true }
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Get tenant info for callback
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, businessName: true }
    });

    // Kullanıcı IP adresini al
    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                   request.headers.get('x-real-ip') ||
                   '127.0.0.1';

    console.log('📝 [MOBILE PAYMENT] Creating payment record...', {
      tenantId,
      customerId: customer.id,
      amount,
      userIp
    });

    // Unique merchant order ID oluştur
    const merchantOid = `MAPT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Customer email - fallback to phone-based email
    const customerEmail = customer.email && !customer.email.includes('@temp.com')
      ? customer.email
      : `${customer.phone}@customer.netrandevu.com`;

    // Payment kaydı oluştur
    const payment = await prisma.payment.create({
      data: {
        id: `mpay${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        customerEmail,
        customerPhone: customer.phone || '',
        merchantOid,
        amount,
        paymentAmount: Math.round(amount * 100),
        currency: 'TL',
        status: 'pending',
        userIp,
        userBasket: appointmentData ? JSON.stringify(appointmentData) : null
      }
    });

    console.log('✅ [MOBILE PAYMENT] Payment record created:', payment.id);

    // PayTR config'i logla
    logPayTRConfig();

    // Base URL
    const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.netrandevu.com';

    // Mobile için özel success/fail URL'leri
    // Deep link scheme kullanarak mobil uygulamaya geri dönüş sağlanır
    const successUrl = `${baseUrl}/api/mobile/payment/callback?status=success&merchant_oid=${merchantOid}`;
    const failUrl = `${baseUrl}/api/mobile/payment/callback?status=failed&merchant_oid=${merchantOid}`;

    console.log('🔗 [MOBILE PAYMENT] Success URL:', successUrl);
    console.log('🔗 [MOBILE PAYMENT] Fail URL:', failUrl);

    // PayTR'dan token al
    const paytrResult = await initiatePayment({
      merchantOid,
      userIp,
      email: customerEmail,
      amount,
      basket: [
        {
          name: serviceName,
          price: amount,
          quantity: 1
        }
      ],
      currency: 'TL',
      noInstallment: 0,
      maxInstallment: 0,
      successUrl,
      failUrl
    });

    if (paytrResult.status === 'failed' || !paytrResult.token) {
      console.error('❌ [MOBILE PAYMENT] PayTR token generation failed:', paytrResult.reason);

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failedReason: paytrResult.reason || 'Unknown error'
        }
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Ödeme başlatılamadı',
          error: paytrResult.reason
        },
        { status: 500 }
      );
    }

    // Token'ı payment kaydına ekle
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paytrToken: paytrResult.token
      }
    });

    console.log('✅ [MOBILE PAYMENT] PayTR token received successfully');

    // iframe URL oluştur
    const iframeUrl = `https://www.paytr.com/odeme/guvenli/${paytrResult.token}`;

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        iframeToken: paytrResult.token,
        paymentUrl: iframeUrl,
        merchantOid
      },
      message: 'Ödeme başlatıldı'
    });

  } catch (error) {
    console.error('❌ [MOBILE PAYMENT] Error initiating payment:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Ödeme başlatılırken hata oluştu',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
