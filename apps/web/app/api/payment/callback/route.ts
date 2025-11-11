import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { validateCallbackHash } from '../../../../lib/paytr-client';
import bcrypt from 'bcryptjs';

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
    console.log('='.repeat(80));
    console.log('🔔 [PAYMENT CALLBACK] *** CALLBACK RECEIVED FROM PAYTR ***');
    console.log('Time:', new Date().toISOString());
    console.log('='.repeat(80));

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

      // Eğer appointmentData veya registrationData varsa, işle
      if (payment.userBasket) {
        try {
          const basketData = JSON.parse(payment.userBasket);

          // İşletme kaydı mı, randevu mu kontrol et
          if (basketData.type === 'business_registration') {
            console.log('🏢 [PAYMENT CALLBACK] Creating business registration...', basketData);

            // Hash password
            const hashedPassword = await bcrypt.hash(basketData.password, 10);

            // Slug oluştur (business name'den)
            const generateSlug = (name: string): string => {
              return name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            };

            let slug = generateSlug(basketData.businessName);

            // Slug'ın benzersiz olduğundan emin ol
            let slugExists = await prisma.tenant.findUnique({ where: { slug } });
            let counter = 1;
            while (slugExists) {
              slug = `${generateSlug(basketData.businessName)}-${counter}`;
              slugExists = await prisma.tenant.findUnique({ where: { slug } });
              counter++;
            }

            console.log('📝 [PAYMENT CALLBACK] Generated unique slug:', slug);

            // Domain ve username oluştur (unique olmalı)
            const domain = `${slug}.netrandevu.com`;
            const username = basketData.username;

            // Subscription tarihlerini hesapla (paket süresine göre)
            const subscriptionStart = new Date();
            const durationDays = basketData.packageDurationDays || 30; // Default 30 gün
            const subscriptionEnd = new Date(subscriptionStart.getTime() + durationDays * 24 * 60 * 60 * 1000);

            console.log('📅 [PAYMENT CALLBACK] Subscription dates:', {
              start: subscriptionStart.toISOString(),
              end: subscriptionEnd.toISOString(),
              durationDays
            });

            // Tenant (işletme) oluştur
            const tenant = await prisma.tenant.create({
              data: {
                id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                businessName: basketData.businessName,
                slug: slug,
                domain: domain,
                username: username,
                password: hashedPassword, // Aynı şifre (admin ile aynı)
                ownerName: basketData.ownerName,
                ownerEmail: basketData.ownerEmail,
                phone: basketData.phone || null,
                plan: basketData.subscriptionPlan || 'Standard',
                status: 'active',
                address: basketData.address || null,
                businessType: basketData.businessType || 'other',
                businessDescription: basketData.businessDescription || null,
                subscriptionStart: subscriptionStart,
                subscriptionEnd: subscriptionEnd,
                monthlyRevenue: 0,
                appointmentCount: 0,
                customerCount: 0,
                createdAt: new Date()
              }
            });

            console.log('✅ [PAYMENT CALLBACK] Tenant created:', tenant.id);

            // Payment'ı tenant ile ilişkilendir
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                tenantId: tenant.id
              }
            });

            console.log('✅ [PAYMENT CALLBACK] Business registration completed successfully');

            // Send welcome email (non-blocking)
            console.log('📧 [PAYMENT CALLBACK] Sending welcome email...');
            fetch(`${process.env.NEXT_PUBLIC_WEB_URL || 'https://netrandevu.com'}/api/send-welcome-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessName: basketData.businessName,
                slug: slug,
                username: username,
                password: basketData.password,
                ownerName: basketData.ownerName,
                ownerEmail: basketData.ownerEmail,
                adminPanelUrl: 'https://admin.netrandevu.com/login',
                landingPageUrl: `https://netrandevu.com/${slug}`
              })
            }).then(async res => {
              const responseText = await res.text();
              if (res.ok) {
                console.log('✅ [PAYMENT CALLBACK] Welcome email sent successfully');
              } else {
                console.error('❌ [PAYMENT CALLBACK] Welcome email error:', res.status, responseText);
              }
            }).catch(err => {
              console.error('❌ [PAYMENT CALLBACK] Welcome email call failed:', err);
            });

          } else {
            // Normal randevu oluşturma akışı
            const appointmentData = basketData;
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
                status: 'confirmed', // Kredi kartı ile ödendi - onaylanmış
                price: payment.amount,
                duration: appointmentData.duration,
                paymentType: payment_type === 'card' ? 'credit_card' : (payment_type === 'eft' ? 'eft' : 'credit_card'), // Kredi Kartı veya EFT
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

            // WhatsApp onay mesajı gönder (non-blocking)
            // Randevu zaten 'confirmed' olarak oluşturuldu, doğrudan WhatsApp API'yi çağırıyoruz
            console.log('📱 [PAYMENT CALLBACK] Triggering WhatsApp confirmation for appointment:', appointment.id);
            fetch(`https://admin.netrandevu.com/api/whatsapp/send-confirmation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ appointmentId: appointment.id })
            }).then(async res => {
              const responseText = await res.text();
              if (res.ok) {
                console.log('✅ [PAYMENT CALLBACK] WhatsApp confirmation sent successfully:', responseText);
              } else {
                console.error('❌ [PAYMENT CALLBACK] WhatsApp API error:', res.status, responseText);
              }
            }).catch(err => {
              console.error('❌ [PAYMENT CALLBACK] WhatsApp API call failed:', err);
            });
          }

        } catch (error) {
          console.error('❌ [PAYMENT CALLBACK] Error processing basket data:', error);
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
          }
          // Ödeme başarılı ama işlem tamamlanamadı
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
