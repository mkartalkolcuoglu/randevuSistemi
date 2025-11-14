import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * Debug endpoint to check for transaction creation errors stored in payment.failedReason
 * GET /api/debug/check-payment-errors
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Checking for payment transaction errors...');

    // Find payments with failedReason containing "Transaction creation failed"
    const paymentsWithErrors = await prisma.payment.findMany({
      where: {
        failedReason: {
          contains: 'Transaction creation failed'
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`📊 Found ${paymentsWithErrors.length} payments with transaction errors`);

    const results = await Promise.all(
      paymentsWithErrors.map(async (payment) => {
        // Check if appointment exists
        let appointment = null;
        if (payment.appointmentId) {
          appointment = await prisma.appointment.findUnique({
            where: { id: payment.appointmentId }
          });
        }

        // Check if transaction exists
        let transaction = null;
        if (payment.appointmentId) {
          transaction = await prisma.transaction.findFirst({
            where: {
              appointmentId: payment.appointmentId,
              type: 'appointment'
            }
          });
        }

        return {
          paymentId: payment.id,
          merchantOid: payment.merchantOid,
          amount: payment.amount,
          status: payment.status,
          paymentType: payment.paymentType,
          appointmentId: payment.appointmentId,
          error: payment.failedReason,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
          hasAppointment: !!appointment,
          hasTransaction: !!transaction,
          appointmentDetails: appointment ? {
            customerName: appointment.customerName,
            serviceName: appointment.serviceName,
            date: appointment.date,
            time: appointment.time,
            status: appointment.status
          } : null
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: results.length,
      payments: results
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
