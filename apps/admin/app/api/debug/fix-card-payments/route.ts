import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * Migration endpoint to create missing transactions for card payment appointments
 * POST /api/debug/fix-card-payments
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [MIGRATION] Starting card payment transaction fix...');

    // Find all card payment appointments without transactions
    const cardAppointments = await prisma.appointment.findMany({
      where: {
        paymentType: 'card',
        status: { in: ['completed', 'confirmed'] },
        packageInfo: null // Only fix non-package appointments
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 [MIGRATION] Found ${cardAppointments.length} card payment appointments`);

    let fixed = 0;
    let alreadyExists = 0;
    let errors = 0;

    for (const apt of cardAppointments) {
      try {
        // Check if transaction already exists
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            appointmentId: apt.id,
            type: 'appointment'
          }
        });

        if (existingTransaction) {
          console.log(`⏭️  [MIGRATION] Transaction already exists for appointment ${apt.id}`);
          alreadyExists++;
          continue;
        }

        // Create transaction
        const transaction = await prisma.transaction.create({
          data: {
            tenantId: apt.tenantId,
            type: 'appointment',
            amount: apt.price || 0,
            description: `Randevu: ${apt.serviceName} - ${apt.customerName}`,
            paymentType: apt.paymentType,
            customerId: apt.customerId,
            customerName: apt.customerName,
            appointmentId: apt.id,
            date: apt.date,
            profit: 0
          }
        });

        console.log(`✅ [MIGRATION] Created transaction ${transaction.id} for appointment ${apt.id}`);
        fixed++;

      } catch (error) {
        console.error(`❌ [MIGRATION] Error fixing appointment ${apt.id}:`, error);
        errors++;
      }
    }

    console.log(`✅ [MIGRATION] Migration completed. Fixed: ${fixed}, Already exists: ${alreadyExists}, Errors: ${errors}`);

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      summary: {
        total: cardAppointments.length,
        fixed,
        alreadyExists,
        errors
      }
    });

  } catch (error) {
    console.error('❌ [MIGRATION] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
