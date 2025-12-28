import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { validateCallbackHash } from '../../../../../lib/paytr-client';

/**
 * PayTR Callback Handler for Mobile
 *
 * GET /api/mobile/payment/callback?status=success&merchant_oid=xxx
 * - Redirect from PayTR after payment (success/fail URL)
 *
 * POST /api/mobile/payment/callback
 * - PayTR server-to-server callback
 */

// GET - Handle redirect from PayTR (success/fail URL)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const merchantOid = searchParams.get('merchant_oid');

  console.log('📲 [MOBILE PAYMENT CALLBACK] GET redirect received:', { status, merchantOid });

  // Deep link URL'i oluştur - mobil uygulama bu URL'i yakalayacak
  const deepLinkBase = 'netrandevu://payment';

  if (status === 'success' && merchantOid) {
    // Payment başarılı
    const payment = await prisma.payment.findFirst({
      where: { merchantOid }
    });

    if (payment) {
      const redirectUrl = `${deepLinkBase}/success?merchant_oid=${merchantOid}&payment_id=${payment.id}`;

      // HTML ile deep link yönlendirmesi
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Ödeme Başarılı</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #10B981 0%, #059669 100%);
              color: white;
              text-align: center;
            }
            .container {
              padding: 40px;
            }
            .icon {
              font-size: 80px;
              margin-bottom: 20px;
            }
            h1 {
              font-size: 28px;
              margin-bottom: 10px;
            }
            p {
              font-size: 16px;
              opacity: 0.9;
            }
            .btn {
              display: inline-block;
              margin-top: 30px;
              padding: 15px 40px;
              background: white;
              color: #059669;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✓</div>
            <h1>Ödeme Başarılı!</h1>
            <p>Randevunuz için ödemeniz alındı.</p>
            <a href="${redirectUrl}" class="btn">Uygulamaya Dön</a>
          </div>
          <script>
            // Otomatik deep link yönlendirmesi
            setTimeout(function() {
              window.location.href = "${redirectUrl}";
            }, 2000);
          </script>
        </body>
        </html>
      `;

      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  }

  // Payment başarısız veya bulunamadı
  const redirectUrl = `${deepLinkBase}/failed?merchant_oid=${merchantOid || 'unknown'}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Ödeme Başarısız</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
          color: white;
          text-align: center;
        }
        .container {
          padding: 40px;
        }
        .icon {
          font-size: 80px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 10px;
        }
        p {
          font-size: 16px;
          opacity: 0.9;
        }
        .btn {
          display: inline-block;
          margin-top: 30px;
          padding: 15px 40px;
          background: white;
          color: #DC2626;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✗</div>
        <h1>Ödeme Başarısız</h1>
        <p>Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.</p>
        <a href="${redirectUrl}" class="btn">Uygulamaya Dön</a>
      </div>
      <script>
        setTimeout(function() {
          window.location.href = "${redirectUrl}";
        }, 2000);
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// POST - PayTR server-to-server callback
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const merchantOid = formData.get('merchant_oid') as string;
    const status = formData.get('status') as string;
    const totalAmount = formData.get('total_amount') as string;
    const hash = formData.get('hash') as string;
    const failedReasonCode = formData.get('failed_reason_code') as string;
    const failedReasonMsg = formData.get('failed_reason_msg') as string;

    console.log('💳 [MOBILE PAYMENT CALLBACK] POST received:', {
      merchantOid,
      status,
      totalAmount
    });

    // Hash doğrulama
    if (!validateCallbackHash(merchantOid, status, totalAmount, hash)) {
      console.error('❌ [MOBILE PAYMENT CALLBACK] Hash validation failed');
      return new NextResponse('HASH_FAIL', { status: 400 });
    }

    // Payment kaydını bul
    const payment = await prisma.payment.findFirst({
      where: { merchantOid }
    });

    if (!payment) {
      console.error('❌ [MOBILE PAYMENT CALLBACK] Payment not found:', merchantOid);
      return new NextResponse('OK', { status: 200 }); // PayTR'a OK dönmemiz gerekiyor
    }

    // Payment durumunu güncelle
    if (status === 'success') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      console.log('✅ [MOBILE PAYMENT CALLBACK] Payment completed:', payment.id);

      // Eğer appointmentData varsa randevuyu da güncelle
      if (payment.userBasket) {
        try {
          const appointmentData = JSON.parse(payment.userBasket);
          if (appointmentData.appointmentId) {
            await prisma.appointment.update({
              where: { id: appointmentData.appointmentId },
              data: {
                paymentStatus: 'paid',
                paymentId: payment.id
              }
            });
            console.log('✅ [MOBILE PAYMENT CALLBACK] Appointment payment status updated');
          }
        } catch (e) {
          console.error('⚠️ [MOBILE PAYMENT CALLBACK] Error updating appointment:', e);
        }
      }
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failedReason: failedReasonMsg || `Code: ${failedReasonCode}`
        }
      });

      console.log('❌ [MOBILE PAYMENT CALLBACK] Payment failed:', payment.id, failedReasonMsg);
    }

    // PayTR'a OK yanıtı dön (zorunlu)
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('❌ [MOBILE PAYMENT CALLBACK] Error:', error);
    return new NextResponse('OK', { status: 200 }); // Hata olsa bile OK dönmemiz gerekiyor
  }
}
