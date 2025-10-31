import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sendWhatsAppMessage, generateReminderMessage } from '../../../../lib/whapi-client';
import { parse, addHours, isWithinInterval, subMinutes, addMinutes } from 'date-fns';

/**
 * Cron endpoint to check and send appointment reminders
 * Should be called every 5-10 minutes via Vercel Cron
 * 
 * Finds appointments that are:
 * - Confirmed status
 * - Happening in 2 hours (within a 10-minute window)
 * - Haven't had reminder sent yet
 * - Customer wants WhatsApp notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Checking for appointments needing reminders...');

    // Get current time
    const now = new Date();
    const twoHoursFromNow = addHours(now, 2);
    
    // Create time window: 2 hours from now ± 5 minutes
    const windowStart = subMinutes(twoHoursFromNow, 5);
    const windowEnd = addMinutes(twoHoursFromNow, 5);

    // Get today's date in YYYY-MM-DD format
    const today = now.toISOString().split('T')[0];
    const todayFormatted = today.split('-').reverse().join('.'); // DD.MM.YYYY

    // Find appointments that need reminders
    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'confirmed',
        reminderSent: false,
        date: todayFormatted, // Today's appointments only
      },
      include: {
        // We'll need to fetch customer separately since there's no relation
      },
    });

    console.log(`📋 Found ${appointments.length} confirmed appointments today`);

    let sentCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const appointment of appointments) {
      try {
        // Parse appointment date and time
        const [day, month, year] = appointment.date.split('.');
        const [hours, minutes] = appointment.time.split(':');
        const appointmentDateTime = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        );

        // Check if appointment is within the 2-hour window
        if (!isWithinInterval(appointmentDateTime, { start: windowStart, end: windowEnd })) {
          continue; // Not in the window, skip
        }

        console.log(`⏰ Appointment ${appointment.id} is in the 2-hour window`);

        // Get customer details
        const customer = await prisma.customer.findUnique({
          where: { id: appointment.customerId },
        });

        if (!customer) {
          console.log(`⚠️ Customer not found for appointment ${appointment.id}`);
          skippedCount++;
          continue;
        }

        // Check if customer wants WhatsApp notifications
        if (!customer.whatsappNotifications) {
          console.log(`⏭️ Customer ${customer.firstName} opted out of WhatsApp`);
          skippedCount++;
          continue;
        }

        // Check if customer has phone number
        if (!customer.phone) {
          console.log(`⚠️ Customer ${customer.firstName} has no phone number`);
          skippedCount++;
          continue;
        }

        // Get tenant/business details
        const settings = await prisma.settings.findUnique({
          where: { tenantId: appointment.tenantId },
        });

        if (!settings) {
          console.log(`⚠️ Settings not found for tenant ${appointment.tenantId}`);
          skippedCount++;
          continue;
        }

        // Generate reminder message
        const message = generateReminderMessage({
          customerName: appointment.customerName,
          date: appointment.date,
          time: appointment.time,
          staffName: appointment.staffName,
          businessName: settings.businessName,
          businessPhone: settings.businessPhone || '',
          businessAddress: settings.businessAddress || undefined,
        });

        // Send WhatsApp message
        const result = await sendWhatsAppMessage({
          to: customer.phone,
          body: message,
        });

        if (result.sent) {
          // Update appointment
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              reminderSent: true,
              reminderSentAt: new Date(),
            },
          });

          console.log(`✅ Reminder sent for appointment ${appointment.id}`);
          sentCount++;
        } else {
          console.error(`❌ Failed to send reminder for appointment ${appointment.id}:`, result.error);
          errors.push(`${appointment.id}: ${result.error}`);
        }

        // Add small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Error processing appointment ${appointment.id}:`, error);
        errors.push(`${appointment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ Reminder check complete: ${sentCount} sent, ${skippedCount} skipped, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      message: 'Hatırlatma kontrolü tamamlandı',
      stats: {
        totalChecked: appointments.length,
        sent: sentCount,
        skipped: skippedCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('❌ Check reminders error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Hatırlatma kontrolü sırasında hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

