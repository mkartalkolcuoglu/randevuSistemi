import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { initiatePayment, logPayTRConfig } from '../../../../lib/paytr-client';

/**
 * Ödeme başlatma endpoint'i
 *
 * POST /api/payment/initiate
 *
 * Body:
 * {
 *   tenantId: string;
 *   customerId: string;
 *   customerName: string;
 *   customerEmail: string;
 *   customerPhone: string;
 *   amount: number;            // TL cinsinden (örn: 34.56)
 *   serviceName: string;       // Hizmet adı
 *   appointmentData?: {...};   // Randevu bilgileri (opsiyonel, callback'te kullanılacak)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   paymentId: string,
 *   iframeToken: string,       // PayTR iframe URL için
 *   iframeUrl: string,         // Tam iframe URL
 *   merchantOid: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('💳 [PAYMENT] Initiate request received');

    const body = await request.json();
    const {
      tenantId,
      tenantSlug,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      amount,
      serviceName,
      appointmentData
    } = body;

    // Validasyon
    if (!tenantId || !customerEmail || !amount || !serviceName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gerekli alanlar eksik: tenantId, customerEmail, amount, serviceName'
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Geçersiz tutar'
        },
        { status: 400 }
      );
    }

    // Kullanıcı IP adresini al
    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                   request.headers.get('x-real-ip') ||
                   '127.0.0.1';

    console.log('📝 [PAYMENT] Creating payment record...', {
      tenantId,
      customerEmail,
      amount,
      userIp
    });

    // Unique merchant order ID oluştur (PayTR sadece alfanumerik kabul eder, özel karakter yok)
    const merchantOid = `APT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Payment kaydı oluştur (status: pending)
    const payment = await prisma.payment.create({
      data: {
        id: `payment${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        customerId: customerId || null,
        customerName: customerName || null,
        customerEmail,
        customerPhone: customerPhone || null,
        merchantOid,
        amount,
        paymentAmount: Math.round(amount * 100), // Kuruş cinsine çevir
        currency: 'TL',
        status: 'pending',
        userIp,
        // appointmentData varsa JSON olarak sakla
        userBasket: appointmentData ? JSON.stringify(appointmentData) : null
      }
    });

    console.log('✅ [PAYMENT] Payment record created:', payment.id);

    // PayTR config'i logla (debugging için)
    logPayTRConfig();

    // Base URL'i al
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://netrandevu.com';

    // Success ve Fail URL'lerini oluştur (tenant parametresi ile)
    const successUrl = tenantSlug
      ? `${baseUrl}/payment/success?tenant=${tenantSlug}&merchant_oid=${merchantOid}`
      : `${baseUrl}/payment/success?merchant_oid=${merchantOid}`;

    const failUrl = tenantSlug
      ? `${baseUrl}/payment/failed?tenant=${tenantSlug}`
      : `${baseUrl}/payment/failed`;

    console.log('🔗 [PAYMENT] Success URL:', successUrl);
    console.log('🔗 [PAYMENT] Fail URL:', failUrl);

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
      noInstallment: 0, // Taksit var
      maxInstallment: 0, // Sınırsız taksit
      successUrl,
      failUrl
    });

    if (paytrResult.status === 'failed' || !paytrResult.token) {
      console.error('❌ [PAYMENT] PayTR token generation failed:', paytrResult.reason);

      // Payment kaydını failed yap
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
          error: 'Ödeme başlatılamadı',
          details: paytrResult.reason
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

    console.log('✅ [PAYMENT] PayTR token received successfully');

    // iframe URL oluştur
    const iframeUrl = `https://www.paytr.com/odeme/guvenli/${paytrResult.token}`;

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      iframeToken: paytrResult.token,
      iframeUrl,
      merchantOid,
      message: 'Ödeme başlatıldı'
    });

  } catch (error) {
    console.error('❌ [PAYMENT] Error initiating payment:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Ödeme başlatılırken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
