import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { validateCallbackHash } from '../../../../lib/paytr-client';

/**
 * PayTR Callback Endpoint
 *
 * ÖNEMLİ: Bu endpoint PayTR tarafından ödeme sonucunu bildirmek için çağrılır!
 *
 * POST /api/payment/callback
 *
 * PayTR'dan gelen parametreler:
 * - merchant_oid: Sipariş numarası
 * - status: 'success' veya 'failed'
 * - total_amount: Toplam tutar (kuruş cinsinden)
 * - hash: Güvenlik hash'i
 * - payment_type: 'card' veya 'eft'
 * - failed_reason_code: Hata kodu (failed ise)
 * - failed_reason_msg: Hata mesajı (failed ise)
 *
 * DÖNÜŞ DEĞERİ: Plain text "OK" olmalı!
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 [PAYMENT CALLBACK] Received callback from PayTR');

    const formData = await request.formData();

    // PayTR parametrelerini al
    const merchant_oid = formData.get('merchant_oid') as string;
    const status = formData.get('status') as string;
    const total_amount = formData.get('total_amount') as string;
    const hash = formData.get('hash') as string;
    const payment_type = formData.get('payment_type') as string;
    const failed_reason_code = formData.get('failed_reason_code') as string;
    const failed_reason_msg = formData.get('failed_reason_msg') as string;

    console.log('📦 [PAYMENT CALLBACK] Callback data:', {
      merchant_oid,
      status,
      total_amount,
      payment_type,
      hash: hash?.substring(0, 20) + '...'
    });

    // Validasyon
    if (!merchant_oid || !status || !total_amount || !hash) {
      console.error('❌ [PAYMENT CALLBACK] Missing required parameters');
      return new NextResponse('Missing parameters', { status: 400 });
    }

    // Hash doğrulama (GÜVENLİK - ÇOK ÖNEMLİ!)
    const isHashValid = validateCallbackHash(merchant_oid, status, total_amount, hash);

    if (!isHashValid) {
      console.error('❌ [PAYMENT CALLBACK] Invalid hash! Possible security breach!');
      return new NextResponse('Invalid hash', { status: 400 });
    }

    console.log('✅ [PAYMENT CALLBACK] Hash validated successfully');

    // Payment kaydını bul
    const payment = await prisma.payment.findUnique({
      where: { merchantOid: merchant_oid }
    });

    if (!payment) {
      console.error('❌ [PAYMENT CALLBACK] Payment not found:', merchant_oid);
      // PayTR'a OK dönmeliyiz yoksa tekrar dener
      return new NextResponse('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Eğer payment zaten işlenmişse (duplicate callback), OK dön
    if (payment.status !== 'pending') {
      console.log('⚠️ [PAYMENT CALLBACK] Payment already processed:', {
        merchantOid: merchant_oid,
        currentStatus: payment.status
      });
      return new NextResponse('OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    console.log('🔄 [PAYMENT CALLBACK] Processing payment...', {
      paymentId: payment.id,
      status
    });

    // BAŞARILI ÖDEME
    if (status === 'success') {
      console.log('✅ [PAYMENT CALLBACK] Payment successful!');

      // Payment kaydını güncelle
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'success',
          paymentType: payment_type || 'card',
          paytrHash: hash,
          paidAt: new Date()
        }
      });

      // Eğer appointmentData varsa, randevu oluştur
      if (payment.userBasket) {
        try {
          const appointmentData = JSON.parse(payment.userBasket);
          console.log('📅 [PAYMENT CALLBACK] Creating appointment...', appointmentData);

          // Check for time slot conflicts
          console.log('🔍 [PAYMENT CALLBACK] Checking for time slot conflicts');
          const existingAppointment = await prisma.appointment.findFirst({
            where: {
              staffId: appointmentData.staffId,
              date: appointmentData.date,
              time: appointmentData.time,
              status: {
                not: 'cancelled' // Sadece iptal edilmemiş randevuları kontrol et
              }
            }
          });

          if (existingAppointment) {
            console.error('❌ [PAYMENT CALLBACK] Time slot conflict:', {
              date: appointmentData.date,
              time: appointmentData.time,
              staffId: appointmentData.staffId,
              existingAppointmentId: existingAppointment.id
            });
            // Payment başarılı ama randevu oluşturulamadı (time slot conflict)
            // Bu durumu loglayalım ve PayTR'a OK dönmeliyiz
            throw new Error(`Time slot conflict: ${appointmentData.date} ${appointmentData.time} is already booked`);
          }

          console.log('✅ [PAYMENT CALLBACK] Time slot is available');

          // Randevu oluştur
          const appointment = await prisma.appointment.create({
            data: {
              id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              tenantId: appointmentData.tenantId,
              customerId: appointmentData.customerId,
              customerName: appointmentData.customerName,
              customerPhone: appointmentData.customerPhone,
              customerEmail: appointmentData.customerEmail,
              serviceId: appointmentData.serviceId,
              serviceName: appointmentData.serviceName,
              staffId: appointmentData.staffId,
              staffName: appointmentData.staffName,
              date: appointmentData.date,
              time: appointmentData.time,
              status: 'scheduled', // Yeni randevu
              price: payment.amount,
              duration: appointmentData.duration,
              paymentType: payment_type || 'card',
              paymentStatus: 'paid', // Ödeme başarılı
              paymentId: payment.id,
              notes: appointmentData.notes || null
            }
          });

          console.log('✅ [PAYMENT CALLBACK] Appointment created:', appointment.id);

          // Payment'a appointment ID'yi ekle
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              appointmentId: appointment.id
            }
          });

          // Notification oluştur
          await prisma.notification.create({
            data: {
              id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              tenantId: appointmentData.tenantId,
              type: 'new_appointment',
              title: 'Yeni Randevu',
              message: `${appointmentData.customerName} - ${appointmentData.serviceName} (${appointmentData.date} ${appointmentData.time}) - Ödeme Alındı`,
              link: `/admin/appointments`,
              read: false
            }
          });

          console.log('✅ [PAYMENT CALLBACK] Notification created');

        } catch (error) {
          console.error('❌ [PAYMENT CALLBACK] Error creating appointment:', error);
          // Ödeme başarılı ama randevu oluşturulamadı
          // Bu durumu loglayalım ama PayTR'a OK dönmeliyiz
        }
      }

    }
    // BAŞARISIZ ÖDEME
    else if (status === 'failed') {
      console.log('❌ [PAYMENT CALLBACK] Payment failed!', {
        code: failed_reason_code,
        message: failed_reason_msg
      });

      // Payment kaydını güncelle
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          paytrHash: hash,
          failedReason: `Code: ${failed_reason_code || 'N/A'}, Message: ${failed_reason_msg || 'Unknown'}`
        }
      });
    }

    console.log('✅ [PAYMENT CALLBACK] Callback processed successfully');

    // PayTR'a mutlaka "OK" dönmeliyiz (plain text)
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('❌ [PAYMENT CALLBACK] Error processing callback:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Hata olsa bile PayTR'a OK dönmeliyiz ki tekrar denemesin
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
