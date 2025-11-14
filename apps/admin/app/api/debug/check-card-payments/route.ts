import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * Debug endpoint to check card payment appointments and their transactions
 * GET /api/debug/check-card-payments
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Checking card payment appointments...');

    // Find all card payment appointments
    const cardAppointments = await prisma.appointment.findMany({
      where: {
        paymentType: 'card',
        status: { in: ['completed', 'confirmed'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        customerName: true,
        serviceName: true,
        price: true,
        paymentType: true,
        status: true,
        date: true,
        tenantId: true,
        packageInfo: true,
        createdAt: true
      }
    });

    console.log(`📊 [DEBUG] Found ${cardAppointments.length} card payment appointments`);

    const results = [];
    let missingCount = 0;

    for (const apt of cardAppointments) {
      // Check if transaction exists
      const transaction = await prisma.transaction.findFirst({
        where: {
          appointmentId: apt.id,
          type: 'appointment'
        }
      });

      const hasTransaction = !!transaction;
      if (!hasTransaction) {
        missingCount++;
      }

      results.push({
        appointment: {
          id: apt.id,
          customerName: apt.customerName,
          serviceName: apt.serviceName,
          price: apt.price,
          paymentType: apt.paymentType,
          status: apt.status,
          date: apt.date,
          hasPackage: !!apt.packageInfo,
          createdAt: apt.createdAt
        },
        transaction: transaction ? {
          id: transaction.id,
          amount: transaction.amount,
          paymentType: transaction.paymentType,
          date: transaction.date
        } : null,
        hasTransaction,
        needsFix: !hasTransaction && !apt.packageInfo // Only fix if no package was used
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: cardAppointments.length,
        withTransaction: cardAppointments.length - missingCount,
        missingTransaction: missingCount
      },
      results
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
