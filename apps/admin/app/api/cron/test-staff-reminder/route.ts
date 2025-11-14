import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { formatPhoneForWhatsApp, sendWhatsAppMessage } from '../../../../lib/whapi-client';

/**
 * Test endpoint for daily staff reminder (no auth required for testing)
 * GET /api/cron/test-staff-reminder
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [TEST] Starting daily staff reminder test...');

    // Get today's date in Turkey timezone
    const now = new Date();
    const turkeyNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const todayStr = turkeyNow.toISOString().split('T')[0];

    console.log('📅 [TEST] Getting appointments for:', {
      date: todayStr,
      dayName: turkeyNow.toLocaleDateString('tr-TR', { weekday: 'long' }),
      timezone: 'Europe/Istanbul'
    });

    // Get all staff members who have phone numbers and are active
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

    console.log(`👥 [TEST] Found ${allStaff.length} active staff members`);

    const staffSummaries = [];

    // Prepare summary for each staff member
    for (const staff of allStaff) {
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

      if (todayAppointments.length > 0) {
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

        staffSummaries.push({
          staff: {
            id: staff.id,
            name: `${staff.firstName} ${staff.lastName}`,
            phone: staff.phone
          },
          appointmentCount: todayAppointments.length,
          appointments: todayAppointments.map(a => ({
            time: a.time,
            customer: a.customerName,
            service: a.serviceName
          })),
          message: message,
          businessName: tenant?.businessName
        });
      }
    }

    return NextResponse.json({
      success: true,
      date: todayStr,
      dayName: turkeyNow.toLocaleDateString('tr-TR', { weekday: 'long' }),
      totalStaff: allStaff.length,
      staffWithAppointments: staffSummaries.length,
      summaries: staffSummaries
    });

  } catch (error) {
    console.error('❌ [TEST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
