import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { formatPhoneForSMS } from '../../../../lib/netgsm-client';

/**
 * Cron Job: Send appointment reminders based on tenant settings
 *
 * This endpoint is called by Vercel Cron every 5 minutes
 * It finds appointments that need reminders based on each tenant's reminderMinutes setting
 * and sends WhatsApp + SMS reminders
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

    // Get all tenant settings to know their reminder preferences
    const allSettings = await prisma.settings.findMany({
      select: {
        tenantId: true,
        reminderMinutes: true
      }
    });

    console.log(`📋 [CRON] Found ${allSettings.length} tenants with settings`);

    // Group tenants by their reminder minutes setting
    const tenantsByReminderTime = new Map<number, string[]>();

    for (const setting of allSettings) {
      const reminderMinutes = setting.reminderMinutes || 120; // Default: 2 hours
      if (!tenantsByReminderTime.has(reminderMinutes)) {
        tenantsByReminderTime.set(reminderMinutes, []);
      }
      tenantsByReminderTime.get(reminderMinutes)!.push(setting.tenantId);
    }

    console.log(`🔍 [CRON] Reminder time groups:`, Array.from(tenantsByReminderTime.entries()).map(([mins, tenants]) => ({
      reminderMinutes: mins,
      tenantCount: tenants.length
    })));

    let allAppointments: any[] = [];

    // For each reminder time group, find matching appointments
    for (const [reminderMinutes, tenantIds] of tenantsByReminderTime.entries()) {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + reminderMinutes * 60 * 1000);

      // Format dates for database query (YYYY-MM-DD) - using Turkey timezone
      const turkeyNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
      const turkeyReminderTime = new Date(turkeyNow.getTime() + reminderMinutes * 60 * 1000);

      const dateStr = turkeyReminderTime.toISOString().split('T')[0];
      const timeExact = turkeyReminderTime.toTimeString().substring(0, 5);

      console.log(`⏰ [CRON] Checking ${reminderMinutes}min reminder for ${tenantIds.length} tenants:`, {
        dateStr,
        timeExact,
        timezone: 'Europe/Istanbul'
      });

      // Find appointments that need reminders for this time group
      const appointments = await prisma.appointment.findMany({
        where: {
          tenantId: { in: tenantIds },
          date: dateStr,
          time: timeExact,
          status: {
            in: ['confirmed', 'pending'] // Only send reminders for active appointments
          },
          reminderSent: false // Only send if reminder hasn't been sent yet
        }
      });

      if (appointments.length > 0) {
        console.log(`✅ [CRON] Found ${appointments.length} appointments for ${reminderMinutes}min reminder`);
        allAppointments.push(...appointments);
      }
    }

    console.log(`📋 [CRON] Total appointments needing reminders: ${allAppointments.length}`);

    // Log all appointments for debugging
    if (allAppointments.length > 0) {
      console.log('📋 [CRON] Appointments details:', JSON.stringify(allAppointments.map(a => ({
        id: a.id,
        tenantId: a.tenantId,
        date: a.date,
        time: a.time,
        customer: a.customerName,
        phone: a.customerPhone,
        status: a.status
      })), null, 2));
    }

    if (allAppointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No appointments need reminders',
        count: 0
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Send reminders for each appointment
    for (const appointment of allAppointments) {
      try {
        console.log(`📲 [CRON] Sending reminder for appointment ${appointment.id}`);

        // Skip if no phone number
        if (!appointment.customerPhone) {
          console.warn(`⚠️ [CRON] No phone number for appointment ${appointment.id}`);
          errorCount++;
          continue;
        }

        // Get tenant info and settings for the appointment
        const tenant = await prisma.tenant.findUnique({
          where: { id: appointment.tenantId },
          select: { businessName: true, address: true }
        });

        const settings = await prisma.settings.findUnique({
          where: { tenantId: appointment.tenantId },
          select: { reminderMinutes: true }
        });

        const reminderMinutes = settings?.reminderMinutes || 120;

        // Format reminder time text
        let reminderTimeText = '';
        if (reminderMinutes < 60) {
          reminderTimeText = `${reminderMinutes} dakika sonra`;
        } else if (reminderMinutes < 1440) {
          const hours = Math.floor(reminderMinutes / 60);
          reminderTimeText = `${hours} saat sonra`;
        } else {
          const days = Math.floor(reminderMinutes / 1440);
          reminderTimeText = `${days} gün sonra`;
        }

        // Format phone number
        const phoneNumber = formatPhoneForSMS(appointment.customerPhone);

        // Prepare message templates
        const whatsappMessage = `Merhaba ${appointment.customerName},

${tenant?.businessName || 'Randevu'} randevunuz ${reminderTimeText}!

📅 Tarih: ${appointment.date}
🕐 Saat: ${appointment.time}
💇 Hizmet: ${appointment.serviceName}
👤 Personel: ${appointment.staffName}

${tenant?.address ? `Adres: ${tenant.address}` : ''}

Görüşmek üzere!`;

        const smsMessage = `${tenant?.businessName || 'Randevu'} randevunuz ${reminderTimeText}. Tarih: ${appointment.date}, Saat: ${appointment.time}, Hizmet: ${appointment.serviceName}. Görüşmek üzere!`;

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

          // Mark reminder as sent to prevent duplicate reminders
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              reminderSent: true,
              reminderSentAt: new Date()
            }
          });

          console.log(`✅ [CRON] Reminder marked as sent for appointment ${appointment.id}`);
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
      total: allAppointments.length,
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
