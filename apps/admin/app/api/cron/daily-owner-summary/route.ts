import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { formatPhoneForWhatsApp, sendWhatsAppMessage } from '../../../../lib/whapi-client';
import { formatPhoneForSMS } from '../../../../lib/netgsm-client';
import { getTemplate, renderTemplate } from '../../../../lib/message-templates';

/**
 * Cron Job: Send daily business summary to tenant owners at 21:00
 *
 * This endpoint is called by Vercel Cron every day at 21:00 Turkey time
 * It sends each tenant owner a WhatsApp message with daily business summary:
 * - Total customers served
 * - Revenue breakdown (cash, card, package)
 * - Cancelled appointments
 * - No-show count
 *
 * GET /api/cron/daily-owner-summary
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 [CRON] Starting daily owner summary job...');

    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('❌ [CRON] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date in Turkey timezone
    const now = new Date();
    const turkeyNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const todayStr = turkeyNow.toISOString().split('T')[0];

    console.log('📅 [CRON] Getting summary for:', {
      date: todayStr,
      dayName: turkeyNow.toLocaleDateString('tr-TR', { weekday: 'long' }),
      timezone: 'Europe/Istanbul'
    });

    // Get all tenants with phone numbers
    const allTenants = await prisma.tenant.findMany({
      where: {
        phone: {
          not: null
        },
        status: 'active'
      },
      select: {
        id: true,
        businessName: true,
        ownerName: true,
        phone: true
      }
    });

    console.log(`🏢 [CRON] Found ${allTenants.length} active tenants`);

    let successCount = 0;
    let errorCount = 0;

    // Send summary to each tenant owner
    for (const tenant of allTenants) {
      try {
        console.log(`📊 [CRON] Preparing summary for ${tenant.businessName}`);

        // Get today's appointments
        const todayAppointments = await prisma.appointment.findMany({
          where: {
            tenantId: tenant.id,
            date: todayStr
          }
        });

        // Calculate statistics
        const totalAppointments = todayAppointments.length;

        // Completed appointments (customers who came)
        const completedAppointments = todayAppointments.filter(a =>
          a.status === 'completed'
        );
        const totalCustomers = completedAppointments.length;

        // Cancelled appointments
        const cancelledAppointments = todayAppointments.filter(a =>
          a.status === 'cancelled'
        );
        const totalCancelled = cancelledAppointments.length;

        // No-show appointments
        const noShowAppointments = todayAppointments.filter(a =>
          a.status === 'no-show'
        );
        const totalNoShow = noShowAppointments.length;

        // Revenue breakdown
        let cashRevenue = 0;
        let cardRevenue = 0;
        let packageRevenue = 0;

        completedAppointments.forEach(apt => {
          const price = apt.price || 0;

          if (apt.paymentType === 'cash') {
            cashRevenue += price;
          } else if (apt.paymentType === 'card') {
            cardRevenue += price;
          } else if (apt.paymentType === 'package') {
            packageRevenue += price;
          }
        });

        const totalRevenue = cashRevenue + cardRevenue + packageRevenue;

        // Skip if no activity today
        if (totalAppointments === 0) {
          console.log(`⏭️ [CRON] Skipping ${tenant.businessName} - no appointments today`);
          continue;
        }

        // Get tenant settings for channel preference and template
        const tenantSettings = await prisma.settings.findUnique({
          where: { tenantId: tenant.id },
          select: { notificationSettings: true, messageTemplates: true }
        });

        let notifSettings: any = {};
        try {
          notifSettings = tenantSettings?.notificationSettings ? JSON.parse(tenantSettings.notificationSettings) : {};
        } catch { /* use defaults */ }
        const ownerChannel = notifSettings.ownerDailyChannel || 'whatsapp';

        if (ownerChannel === 'off') {
          console.log(`⏭️ [CRON] Owner summary disabled for ${tenant.businessName}`);
          continue;
        }

        // Format the message using template
        const dayName = turkeyNow.toLocaleDateString('tr-TR', { weekday: 'long' });
        const dateFormatted = turkeyNow.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const ownerTemplate = getTemplate(tenantSettings?.messageTemplates, 'ownerDailyReminder');
        const message = renderTemplate(ownerTemplate, {
          sahipAdi: tenant.ownerName,
          gun: dayName,
          tarih: dateFormatted,
          gelenMusteri: String(totalCustomers),
          iptalSayisi: String(totalCancelled),
          gelmediler: String(totalNoShow),
          toplamRandevu: String(totalAppointments),
          nakitGelir: cashRevenue.toLocaleString('tr-TR'),
          kartGelir: cardRevenue.toLocaleString('tr-TR'),
          paketGelir: packageRevenue.toLocaleString('tr-TR'),
          toplamGelir: totalRevenue.toLocaleString('tr-TR'),
          isletmeAdi: tenant.businessName
        });

        // Send via selected channel
        let sent = false;

        if (ownerChannel === 'whatsapp') {
          const phoneNumber = formatPhoneForWhatsApp(tenant.phone!);
          const result = await sendWhatsAppMessage({ to: phoneNumber, body: message });
          sent = result.sent;
          if (!sent) console.error(`❌ [CRON] WhatsApp failed for ${tenant.businessName}:`, result.error);
        } else if (ownerChannel === 'sms') {
          const phoneNumber = formatPhoneForSMS(tenant.phone!);
          const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.netrandevu.com'}/api/netgsm/send-sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: phoneNumber, message })
          });
          const smsResult = await smsResponse.json();
          sent = smsResult.success;
          if (!sent) console.error(`❌ [CRON] SMS failed for ${tenant.businessName}:`, smsResult.error);
        }

        if (sent) {
          console.log(`✅ [CRON] Summary sent to ${tenant.businessName} via ${ownerChannel}`);
          successCount++;
        } else {
          errorCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ [CRON] Error sending to tenant ${tenant.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ [CRON] Daily owner summary job completed. Success: ${successCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: 'Daily owner summaries sent',
      total: allTenants.length,
      sent: successCount,
      errors: errorCount
    });

  } catch (error) {
    console.error('❌ [CRON] Error in daily owner summary job:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
