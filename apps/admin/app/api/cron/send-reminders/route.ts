import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { formatPhone } from '../../../../lib/netgsm-client';

/**
 * Cron Job: Send appointment reminders 2 hours before
 *
 * This endpoint is called by Vercel Cron every 15 minutes
 * It finds appointments that are 2 hours away and sends WhatsApp + SMS reminders
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

    // Calculate time range: 2 hours from now (with 15-minute window)
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twoHours15MinLater = new Date(now.getTime() + (2 * 60 + 15) * 60 * 1000);

    console.log('📅 [CRON] Time range:', {
      now: now.toISOString(),
      rangeStart: twoHoursLater.toISOString(),
      rangeEnd: twoHours15MinLater.toISOString()
    });

    // Format dates for database query (YYYY-MM-DD)
    const dateStr = twoHoursLater.toISOString().split('T')[0];

    // Format times for database query (HH:MM)
    const timeStart = twoHoursLater.toTimeString().substring(0, 5);
    const timeEnd = twoHours15MinLater.toTimeString().substring(0, 5);

    console.log('🔍 [CRON] Querying appointments:', { dateStr, timeStart, timeEnd });

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

    if (appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No appointments need reminders',
        count: 0
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Send reminders for each appointment
    for (const appointment of appointments) {
      try {
        console.log(`📲 [CRON] Sending reminder for appointment ${appointment.id}`);

        // Format phone number
        const phoneNumber = formatPhone(appointment.customerPhone);

        // Prepare message templates
        const whatsappMessage = `Merhaba ${appointment.customerName},

${appointment.tenant?.businessName || 'Randevu'} randevunuz 2 saat sonra!

📅 Tarih: ${appointment.date}
🕐 Saat: ${appointment.time}
💇 Hizmet: ${appointment.serviceName}
👤 Personel: ${appointment.staffName}

${appointment.tenant?.address ? `Adres: ${appointment.tenant.address}` : ''}

Görüşmek üzere!`;

        const smsMessage = `${appointment.tenant?.businessName || 'Randevu'} randevunuz 2 saat sonra. Tarih: ${appointment.date}, Saat: ${appointment.time}, Hizmet: ${appointment.serviceName}. Görüşmek üzere!`;

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
