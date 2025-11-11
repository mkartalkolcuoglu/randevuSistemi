import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { initiatePayment, logPayTRConfig } from '../../../../lib/paytr-client';

/**
 * İşletme kaydı için ödeme başlatma endpoint'i
 *
 * POST /api/payment/initiate-registration
 *
 * Body:
 * {
 *   businessName: string;
 *   businessType: string;
 *   businessDescription: string;
 *   address: string;
 *   ownerName: string;
 *   ownerEmail: string;
 *   phone: string;
 *   username: string;
 *   password: string;
 *   subscriptionPlan: string;
 *   packageId: string;
 *   packagePrice: number;
 *   packageName: string;
 *   packageDurationDays: number;
 * }
 *
 * Response:
 * {
 *   success: true,
 *   paymentId: string,
 *   iframeToken: string,
 *   iframeUrl: string,
 *   merchantOid: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('💳 [REGISTRATION PAYMENT] Initiate request received');

    const body = await request.json();
    const {
      businessName,
      businessType,
      businessDescription,
      address,
      ownerName,
      ownerEmail,
      phone,
      username,
      password,
      subscriptionPlan,
      packageId,
      packagePrice,
      packageName,
      packageDurationDays
    } = body;

    // Validasyon
    if (!businessName || !ownerEmail || !packagePrice || !packageName || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gerekli alanlar eksik'
        },
        { status: 400 }
      );
    }

    if (packagePrice <= 0) {
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

    console.log('📝 [REGISTRATION PAYMENT] Creating payment record...', {
      businessName,
      ownerEmail,
      packagePrice,
      packageName,
      userIp
    });

    // Unique merchant order ID oluştur (PayTR sadece alfanumerik kabul eder)
    const merchantOid = `REG${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // İşletme kayıt verilerini JSON olarak sakla
    const registrationData = {
      businessName,
      businessType,
      businessDescription,
      address,
      ownerName,
      ownerEmail,
      phone,
      username,
      password,
      subscriptionPlan,
      packageId,
      packageDurationDays,
      type: 'business_registration' // Callback'te ayırt etmek için
    };

    // Payment kaydı oluştur (status: pending)
    // tenantId null çünkü henüz tenant oluşturulmadı
    const payment = await prisma.payment.create({
      data: {
        id: `payment${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        tenantId: null, // Henüz tenant yok
        customerId: null,
        customerName: ownerName,
        customerEmail: ownerEmail,
        customerPhone: phone || null,
        merchantOid,
        amount: packagePrice,
        paymentAmount: Math.round(packagePrice * 100), // Kuruş cinsine çevir
        currency: 'TL',
        status: 'pending',
        userIp,
        // Kayıt verilerini JSON olarak sakla
        userBasket: JSON.stringify(registrationData)
      }
    });

    console.log('✅ [REGISTRATION PAYMENT] Payment record created:', payment.id);

    // PayTR config'i logla (debugging için)
    logPayTRConfig();

    // Base URL'i al
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://netrandevu.com';

    // Success ve Fail URL'lerini oluştur
    const successUrl = `${baseUrl}/payment/registration-success?merchant_oid=${merchantOid}`;
    const failUrl = `${baseUrl}/payment/registration-failed`;

    console.log('🔗 [REGISTRATION PAYMENT] Success URL:', successUrl);
    console.log('🔗 [REGISTRATION PAYMENT] Fail URL:', failUrl);

    // PayTR'dan token al
    const paytrResult = await initiatePayment({
      merchantOid,
      userIp,
      email: ownerEmail,
      amount: packagePrice,
      basket: [
        {
          name: `${packageName} Paketi`,
          price: packagePrice,
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
      console.error('❌ [REGISTRATION PAYMENT] PayTR token generation failed:', paytrResult.reason);

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

    console.log('✅ [REGISTRATION PAYMENT] PayTR token received successfully');

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
    console.error('❌ [REGISTRATION PAYMENT] Error initiating payment:', error);

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
