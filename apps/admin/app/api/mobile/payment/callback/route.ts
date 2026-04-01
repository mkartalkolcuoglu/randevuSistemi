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
      console.log('📲 [MOBILE PAYMENT CALLBACK GET] Payment found:', payment.id, 'status:', payment.status);

      // Ödeme durumu pending ise completed yap
      if (payment.status === 'pending') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            completedAt: new Date()
          }
        });
        console.log('✅ [MOBILE PAYMENT CALLBACK GET] Payment marked as completed:', payment.id);
      }

      // Randevu oluştur (status'tan bağımsız - her zaman kontrol et)
      if (payment.userBasket) {
        try {
          const appointmentData = JSON.parse(payment.userBasket);
          console.log('📅 [MOBILE PAYMENT CALLBACK GET] Appointment data:', appointmentData);

          if (appointmentData.tenantId && appointmentData.serviceId && appointmentData.staffId && appointmentData.date && appointmentData.time) {
            // Mevcut randevu var mı kontrol et
            const existingAppointment = await prisma.appointment.findFirst({
              where: {
                paymentId: payment.id
              }
            });

            if (!existingAppointment) {
              console.log('📅 [MOBILE PAYMENT CALLBACK GET] No existing appointment, creating new one...');

              // Get service details
              const service = await prisma.service.findUnique({
                where: { id: appointmentData.serviceId }
              });

              // Get staff details
              const staff = await prisma.staff.findUnique({
                where: { id: appointmentData.staffId }
              });

              // Get customer info
              let customerId = payment.customerId;
              let customerName = payment.customerName || 'Müşteri';
              let customerPhone = payment.customerPhone || '';

              if (customerId) {
                const customer = await prisma.customer.findUnique({
                  where: { id: customerId }
                });
                if (customer) {
                  customerName = `${customer.firstName} ${customer.lastName}`.trim();
                  customerPhone = customer.phone || '';
                }
              }

              if (service && staff) {
                const newAppointment = await prisma.appointment.create({
                  data: {
                    tenantId: appointmentData.tenantId,
                    customerId: customerId || '',
                    customerName,
                    customerPhone,
                    serviceId: appointmentData.serviceId,
                    serviceName: service.name,
                    serviceColor: service.color || null,
                    staffId: appointmentData.staffId,
                    staffName: `${staff.firstName} ${staff.lastName}`.trim(),
                    date: appointmentData.date,
                    time: appointmentData.time,
                    duration: service.duration,
                    price: service.price,
                    status: 'confirmed',
                    paymentType: 'credit_card',
                    paymentStatus: 'paid',
                    paymentId: payment.id,
                    notes: appointmentData.notes || '',
                  }
                });
                console.log('✅ [MOBILE PAYMENT CALLBACK GET] Appointment created:', newAppointment.id);
              } else {
                console.log('⚠️ [MOBILE PAYMENT CALLBACK GET] Service or staff not found:', { serviceId: appointmentData.serviceId, staffId: appointmentData.staffId });
              }
            } else {
              console.log('ℹ️ [MOBILE PAYMENT CALLBACK GET] Appointment already exists:', existingAppointment.id);
            }
          } else {
            console.log('⚠️ [MOBILE PAYMENT CALLBACK GET] Missing appointment data fields:', appointmentData);
          }
        } catch (e) {
          console.error('⚠️ [MOBILE PAYMENT CALLBACK GET] Error creating appointment:', e);
        }
      } else {
        console.log('⚠️ [MOBILE PAYMENT CALLBACK GET] No userBasket in payment');
      }

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
              cursor: pointer;
              border: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">✓</div>
            <h1>Ödeme Başarılı!</h1>
            <p>Randevunuz için ödemeniz alındı.</p>
            <button class="btn" onclick="goToApp()">Uygulamaya Dön</button>
          </div>
          <script>
            function goToApp() {
              // React Native WebView'a mesaj gönder
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_SUCCESS' }));
              } else {
                // Fallback: deep link dene
                window.location.href = "${redirectUrl}";
              }
            }

            // 3 saniye sonra otomatik yönlendir
            setTimeout(function() {
              goToApp();
            }, 3000);
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
          cursor: pointer;
          border: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✗</div>
        <h1>Ödeme Başarısız</h1>
        <p>Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.</p>
        <button class="btn" onclick="goToApp()">Uygulamaya Dön</button>
      </div>
      <script>
        function goToApp() {
          // React Native WebView'a mesaj gönder
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_FAILED' }));
          } else {
            // Fallback: deep link dene
            window.location.href = "${redirectUrl}";
          }
        }

        // 3 saniye sonra otomatik yönlendir
        setTimeout(function() {
          goToApp();
        }, 3000);
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

      // Eğer appointmentData varsa randevuyu oluştur veya güncelle
      if (payment.userBasket) {
        try {
          const appointmentData = JSON.parse(payment.userBasket);
          console.log('📅 [MOBILE PAYMENT CALLBACK] Appointment data:', appointmentData);

          if (appointmentData.appointmentId) {
            // Mevcut randevuyu güncelle
            await prisma.appointment.update({
              where: { id: appointmentData.appointmentId },
              data: {
                paymentStatus: 'paid',
                paymentId: payment.id
              }
            });
            console.log('✅ [MOBILE PAYMENT CALLBACK] Appointment payment status updated');
          } else if (appointmentData.tenantId && appointmentData.serviceId && appointmentData.staffId && appointmentData.date && appointmentData.time) {
            // Mevcut randevu var mı kontrol et (GET callback zaten oluşturmuş olabilir)
            const existingAppointment = await prisma.appointment.findFirst({
              where: { paymentId: payment.id }
            });

            if (existingAppointment) {
              console.log('ℹ️ [MOBILE PAYMENT CALLBACK] Appointment already exists:', existingAppointment.id);
            } else {
              // Yeni randevu oluştur
              console.log('📅 [MOBILE PAYMENT CALLBACK] Creating new appointment...');

              // Get service details
              const service = await prisma.service.findUnique({
                where: { id: appointmentData.serviceId }
              });

              // Get staff details
              const staff = await prisma.staff.findUnique({
                where: { id: appointmentData.staffId }
              });

              // Get or create customer
              let customerId = payment.customerId;
              let customerName = payment.customerName || 'Müşteri';
              let customerPhone = payment.customerPhone || '';

              if (customerId) {
                const customer = await prisma.customer.findUnique({
                  where: { id: customerId }
                });
                if (customer) {
                  customerName = `${customer.firstName} ${customer.lastName}`.trim();
                  customerPhone = customer.phone || '';
                }
              }

              if (service && staff) {
                const newAppointment = await prisma.appointment.create({
                  data: {
                    tenantId: appointmentData.tenantId,
                    customerId: customerId || '',
                    customerName,
                    customerPhone,
                    serviceId: appointmentData.serviceId,
                    serviceName: service.name,
                    staffId: appointmentData.staffId,
                    staffName: `${staff.firstName} ${staff.lastName}`.trim(),
                    date: appointmentData.date,
                    time: appointmentData.time,
                    duration: service.duration,
                    price: service.price,
                    status: 'confirmed',
                    paymentType: 'credit_card',
                    paymentStatus: 'paid',
                    paymentId: payment.id,
                    notes: appointmentData.notes || '',
                  }
                });
                console.log('✅ [MOBILE PAYMENT CALLBACK] Appointment created:', newAppointment.id);
              } else {
                console.error('⚠️ [MOBILE PAYMENT CALLBACK] Service or Staff not found');
              }
            }
          }
        } catch (e) {
          console.error('⚠️ [MOBILE PAYMENT CALLBACK] Error creating/updating appointment:', e);
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
