import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * Debug endpoint to check most recent payment
 * GET /api/debug/check-recent-payment
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Checking recent payment...');

    // Find most recent payment
    const recentPayment = await prisma.payment.findFirst({
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (!recentPayment) {
      return NextResponse.json({
        success: false,
        message: 'No payments found'
      });
    }

    // Parse userBasket
    let basketData = null;
    if (recentPayment.userBasket) {
      try {
        basketData = JSON.parse(recentPayment.userBasket);
      } catch (e) {
        console.error('Failed to parse basket:', e);
      }
    }

    // Check if appointment exists
    let appointment = null;
    if (recentPayment.appointmentId) {
      appointment = await prisma.appointment.findUnique({
        where: { id: recentPayment.appointmentId }
      });
    }

    // Check if transaction exists
    let transaction = null;
    if (recentPayment.appointmentId) {
      transaction = await prisma.transaction.findFirst({
        where: {
          appointmentId: recentPayment.appointmentId,
          type: 'appointment'
        }
      });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: recentPayment.id,
        merchantOid: recentPayment.merchantOid,
        amount: recentPayment.amount,
        status: recentPayment.status,
        paymentType: recentPayment.paymentType,
        createdAt: recentPayment.createdAt,
        paidAt: recentPayment.paidAt,
        appointmentId: recentPayment.appointmentId
      },
      basketData,
      appointment: appointment ? {
        id: appointment.id,
        customerName: appointment.customerName,
        serviceName: appointment.serviceName,
        status: appointment.status,
        paymentType: appointment.paymentType,
        price: appointment.price
      } : null,
      transaction: transaction ? {
        id: transaction.id,
        amount: transaction.amount,
        paymentType: transaction.paymentType
      } : null,
      hasAppointment: !!appointment,
      hasTransaction: !!transaction
    });

  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
