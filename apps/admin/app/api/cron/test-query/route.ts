import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * Test endpoint to check what appointments the cron would find
 * No authentication required for testing
 */
export async function GET(request: NextRequest) {
  try {
    // Calculate time range: 10 minutes from now (with 5-minute window for 5-min cron)
    const now = new Date();
    const tenMinutesLater = new Date(now.getTime() + 10 * 60 * 1000);
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);

    // Format dates for database query (YYYY-MM-DD) - using Turkey timezone
    const turkeyNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    const turkeyTenMin = new Date(turkeyNow.getTime() + 10 * 60 * 1000);
    const turkeyFifteenMin = new Date(turkeyNow.getTime() + 15 * 60 * 1000);

    const dateStr = turkeyTenMin.toISOString().split('T')[0];

    // Format times for database query (HH:MM)
    const timeStart = turkeyTenMin.toTimeString().substring(0, 5);
    const timeEnd = turkeyFifteenMin.toTimeString().substring(0, 5);

    const queryInfo = {
      now: now.toISOString(),
      nowLocal: now.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
      rangeStart: tenMinutesLater.toISOString(),
      rangeStartLocal: tenMinutesLater.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
      rangeEnd: fifteenMinutesLater.toISOString(),
      rangeEndLocal: fifteenMinutesLater.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
      dateStr,
      timeStart,
      timeEnd,
      timezone: 'Europe/Istanbul'
    };

    // Find appointments that need reminders
    const appointments = await prisma.appointment.findMany({
      where: {
        date: dateStr,
        time: {
          gte: timeStart,
          lte: timeEnd
        },
        status: {
          in: ['confirmed', 'pending']
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

    // Also query ALL today's appointments for debugging
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
        customerPhone: true,
        status: true
      },
      orderBy: { time: 'asc' }
    });

    return NextResponse.json({
      success: true,
      queryInfo,
      foundAppointments: appointments.map(a => ({
        id: a.id,
        date: a.date,
        time: a.time,
        customer: a.customerName,
        phone: a.customerPhone,
        status: a.status,
        businessName: a.tenant?.businessName
      })),
      allTodayAppointments,
      count: appointments.length,
      allTodayCount: allTodayAppointments.length
    });

  } catch (error) {
    console.error('Error in test query:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
