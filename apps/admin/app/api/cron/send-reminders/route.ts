import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { formatPhoneForSMS } from '../../../../lib/netgsm-client';

/**
 * Cron Job: Send appointment reminders 10 minutes before
 *
 * This endpoint is called by Vercel Cron every 5 minutes
 * It finds appointments that are 10 minutes away and sends WhatsApp + SMS reminders
 *
 * GET /api/cron/send-reminders
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🕐 [CRON] Starting appointment reminder check...');

    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ [CRON] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate time range: 10 minutes from now (with 5-minute window for 5-min cron)
    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);

    console.log('📅 [CRON] Time range:', {
      now: now.toISOString(),
      nowLocal: now.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
      rangeStart: tenMinutesLater.toISOString(),
      rangeStartLocal: tenMinutesLater.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
      rangeEnd: fifteenMinutesLater.toISOString(),
      rangeEndLocal: fifteenMinutesLater.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
    });

    // Format dates for database query (YYYY-MM-DD) - using Turkey timezone
    const turkeyNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const turkeyTenMin = new Date(turkeyNow.getTime() + 10 * 60 * 1000);
    const turkeyFifteenMin = new Date(turkeyNow.getTime() + 15 * 60 * 1000);

    const dateStr = turkeyTenMin.toISOString().split('T')[0];

    // Format times for database query (HH:MM)
    const timeStart = turkeyTenMin.toTimeString().substring(0, 5);
    const timeEnd = turkeyFifteenMin.toTimeString().substring(0, 5);

    console.log('🔍 [CRON] Querying appointments:', {
      dateStr,
      timeStart,
      timeEnd,
      timezone: 'Europe/Istanbul'
    });

    // Find appointments that need reminders
    const appointments = await prisma.appointment.findMany({
      where: {
        date: dateStr,
        time: {
          gte: timeStart,
          lte: timeEnd
        },
        status: {
          in: ['confirmed', 'pending'] // Only send reminders for active appointments
        }
      },
      include: {
        tenant: {
          select: {
            businessName: true,
            address: true
          }
        }
      }
    });

    console.log(`📋 [CRON] Found ${appointments.length} appointments needing reminders`);

    // Log all appointments for debugging
    if (appointments.length > 0) {
      console.log('📋 [CRON] Appointments details:', JSON.stringify(appointments.map(a => ({
        id: a.id,
        date: a.date,
        time: a.time,
        customer: a.customerName,
        phone: a.customerPhone,
        status: a.status
      })), null, 2));
    }

    // Also query and log ALL today's appointments for debugging
    const todayStr = turkeyTenMin.toISOString().split('T')[0];
    const allTodayAppointments = await prisma.appointment.findMany({
      where: {
        date: todayStr,
        status: { in: ['confirmed', 'pending'] }
      },
      select: {
        id: true,
        date: true,
        time: true,
        customerName: true,
        status: true
      },
      orderBy: { time: 'asc' }
    });

    console.log(`📅 [CRON] All today's appointments (${todayStr}):`, JSON.stringify(allTodayAppointments, null, 2));

    if (appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No appointments need reminders',
        count: 0,
        queryParams: { dateStr, timeStart, timeEnd },
        allTodayCount: allTodayAppointments.length
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Send reminders for each appointment
    for (const appointment of appointments) {
      try {
        console.log(`📲 [CRON] Sending reminder for appointment ${appointment.id}`);

        // Skip if no phone number
        if (!appointment.customerPhone) {
          console.warn(`⚠️ [CRON] No phone number for appointment ${appointment.id}`);
          errorCount++;
          continue;
        }

        // Format phone number
        const phoneNumber = formatPhoneForSMS(appointment.customerPhone);

        // Prepare message templates
        const whatsappMessage = `Merhaba ${appointment.customerName},

${appointment.tenant?.businessName || 'Randevu'} randevunuz 10 dakika sonra!

📅 Tarih: ${appointment.date}
🕐 Saat: ${appointment.time}
💇 Hizmet: ${appointment.serviceName}
👤 Personel: ${appointment.staffName}

${appointment.tenant?.address ? `Adres: ${appointment.tenant.address}` : ''}

Görüşmek üzere!`;

        const smsMessage = `${appointment.tenant?.businessName || 'Randevu'} randevunuz 10 dakika sonra. Tarih: ${appointment.date}, Saat: ${appointment.time}, Hizmet: ${appointment.serviceName}. Görüşmek üzere!`;

        // Send WhatsApp reminder
        const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.netrandevu.com'}/api/whapi/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phoneNumber,
            message: whatsappMessage
          })
        });

        const whatsappResult = await whatsappResponse.json();

        if (whatsappResult.success) {
          console.log(`✅ [CRON] WhatsApp reminder sent to ${phoneNumber}`);
        } else {
          console.error(`❌ [CRON] WhatsApp reminder failed for ${phoneNumber}:`, whatsappResult.error);
        }

        // Send SMS reminder
        const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.netrandevu.com'}/api/netgsm/send-sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phoneNumber,
            message: smsMessage
          })
        });

        const smsResult = await smsResponse.json();

        if (smsResult.success) {
          console.log(`✅ [CRON] SMS reminder sent to ${phoneNumber}`);
        } else {
          console.error(`❌ [CRON] SMS reminder failed for ${phoneNumber}:`, smsResult.error);
        }

        // Consider it success if at least one channel succeeded
        if (whatsappResult.success || smsResult.success) {
          successCount++;
        } else {
          errorCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ [CRON] Error sending reminder for appointment ${appointment.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ [CRON] Reminder job completed. Success: ${successCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: 'Reminders sent',
      total: appointments.length,
      successCount,
      errorCount
    });

  } catch (error) {
    console.error('❌ [CRON] Error in reminder job:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
