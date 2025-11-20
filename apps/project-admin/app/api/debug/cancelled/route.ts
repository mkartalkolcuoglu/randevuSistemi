import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    // Check all cancelled appointments
    const allCancelled = await prisma.appointment.findMany({
      where: { status: 'cancelled' },
      select: {
        id: true,
        customerName: true,
        paymentType: true,
        date: true,
        time: true
      },
      take: 10
    });

    // Group by payment type
    const byType = allCancelled.reduce((acc: any, apt) => {
      acc[apt.paymentType] = (acc[apt.paymentType] || 0) + 1;
      return acc;
    }, {});

    // Check cancelled + card
    const cancelledCard = await prisma.appointment.findMany({
      where: {
        status: 'cancelled',
        paymentType: 'card'
      },
      select: {
        id: true,
        customerName: true,
        serviceName: true,
        date: true,
        time: true,
        price: true
      },
      take: 5
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCancelled: allCancelled.length,
        paymentTypes: byType,
        cancelledCardCount: cancelledCard.length,
        samples: {
          allCancelled: allCancelled.slice(0, 3),
          cancelledCard: cancelledCard
        }
      }
    });
  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
