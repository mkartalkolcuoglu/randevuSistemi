import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Get recent card payment appointments
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          in: ['2025-11-22', '2025-11-21', '2025-11-20']
        },
        paymentType: {
          in: ['card', 'credit_card']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        tenantId: true,
        customerName: true,
        date: true,
        time: true,
        status: true,
        paymentType: true,
        price: true,
        createdAt: true
      }
    });

    // Check transactions for each appointment
    const results = await Promise.all(
      appointments.map(async (apt) => {
        const transaction = await prisma.transaction.findFirst({
          where: { appointmentId: apt.id }
        });

        return {
          appointment: {
            id: apt.id,
            tenantId: apt.tenantId,
            customerName: apt.customerName,
            date: apt.date,
            time: apt.time,
            status: apt.status,
            paymentType: apt.paymentType,
            price: apt.price,
            createdAt: apt.createdAt.toISOString()
          },
          hasTransaction: !!transaction,
          transaction: transaction ? {
            id: transaction.id,
            tenantId: transaction.tenantId,
            amount: transaction.amount,
            paymentType: transaction.paymentType,
            date: transaction.date,
            createdAt: transaction.createdAt.toISOString()
          } : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      total: appointments.length,
      results
    });
  } catch (error) {
    console.error('Error checking transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Sorgulama başarısız' },
      { status: 500 }
    );
  }
}
