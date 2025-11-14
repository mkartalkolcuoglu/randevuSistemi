import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { formatPhoneForWhatsApp, sendWhatsAppMessage } from '../../../../lib/whapi-client';

/**
 * Cron Job: Send daily appointment summary to staff at 08:30
 *
 * This endpoint is called by Vercel Cron every day at 08:30 Turkey time
 * It sends each staff member a WhatsApp message with their appointments for the day
 *
 * GET /api/cron/daily-staff-reminder
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🌅 [CRON] Starting daily staff reminder job...');

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

    console.log('📅 [CRON] Getting appointments for:', {
      date: todayStr,
      dayName: turkeyNow.toLocaleDateString('tr-TR', { weekday: 'long' }),
      timezone: 'Europe/Istanbul'
    });

    // Get all staff members who have phone numbers and can login
    const allStaff = await prisma.staff.findMany({
      where: {
        phone: {
          not: null
        },
        status: 'active'
      },
      select: {
        id: true,
        tenantId: true,
        firstName: true,
        lastName: true,
        phone: true
      }
    });

    console.log(`👥 [CRON] Found ${allStaff.length} active staff members`);

    if (allStaff.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No staff members to send reminders to',
        count: 0
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Send daily summary to each staff member
    for (const staff of allStaff) {
      try {
        console.log(`📲 [CRON] Preparing daily summary for ${staff.firstName} ${staff.lastName}`);

        // Get today's appointments for this staff member
        const todayAppointments = await prisma.appointment.findMany({
          where: {
            tenantId: staff.tenantId,
            staffId: staff.id,
            date: todayStr,
            status: {
              in: ['confirmed', 'pending', 'scheduled']
            }
          },
          orderBy: {
            time: 'asc'
          }
        });

        console.log(`📋 [CRON] ${staff.firstName} has ${todayAppointments.length} appointments today`);

        // Skip if no appointments
        if (todayAppointments.length === 0) {
          console.log(`⏭️ [CRON] Skipping ${staff.firstName} - no appointments today`);
          continue;
        }

        // Get tenant info
        const tenant = await prisma.tenant.findUnique({
          where: { id: staff.tenantId },
          select: { businessName: true }
        });

        // Format the appointment list
        const appointmentList = todayAppointments.map((apt, index) => {
          return `${index + 1}. ${apt.time} - ${apt.customerName}
   🔹 ${apt.serviceName}
   ${apt.notes ? `💬 Not: ${apt.notes}` : ''}`;
        }).join('\n\n');

        // Create the message
        const dayName = turkeyNow.toLocaleDateString('tr-TR', { weekday: 'long' });
        const dateFormatted = turkeyNow.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const message = `🌅 Günaydın ${staff.firstName}!

📅 *${dayName}, ${dateFormatted}*

Bugün ${todayAppointments.length} randevunuz var:

${appointmentList}

İyi çalışmalar! 💪

_${tenant?.businessName || 'Randevu Sistemi'}_`;

        // Format and send WhatsApp message
        const phoneNumber = formatPhoneForWhatsApp(staff.phone!);

        const result = await sendWhatsAppMessage({
          to: phoneNumber,
          body: message
        });

        if (result.sent) {
          console.log(`✅ [CRON] Daily summary sent to ${staff.firstName} ${staff.lastName}`);
          successCount++;
        } else {
          console.error(`❌ [CRON] Failed to send to ${staff.firstName}:`, result.error);
          errorCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ [CRON] Error sending to staff ${staff.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ [CRON] Daily staff reminder job completed. Success: ${successCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      message: 'Daily staff reminders sent',
      total: allStaff.length,
      sent: successCount,
      errors: errorCount
    });

  } catch (error) {
    console.error('❌ [CRON] Error in daily staff reminder job:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
