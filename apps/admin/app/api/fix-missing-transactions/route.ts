import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/fix-missing-transactions
 * Finds completed appointments without transactions and creates them
 *
 * Body: { tenantId: string, date?: string }
 * - date: Optional, specific date to check (YYYY-MM-DD format)
 *         If not provided, checks all completed appointments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, date } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [FIX] Finding completed appointments without transactions...');
    console.log('🔍 [FIX] TenantId:', tenantId, 'Date:', date || 'all');

    // Find completed appointments
    const whereCondition: any = {
      tenantId,
      status: { in: ['completed', 'confirmed'] },
      price: { gt: 0 },
      packageInfo: null // Only non-package appointments
    };

    if (date) {
      whereCondition.date = date;
    }

    const completedAppointments = await prisma.appointment.findMany({
      where: whereCondition
    });

    console.log(`📋 [FIX] Found ${completedAppointments.length} completed appointments`);

    // Get existing transactions for these appointments
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        type: 'appointment',
        appointmentId: { in: completedAppointments.map(a => a.id) }
      },
      select: { appointmentId: true }
    });

    const existingAppointmentIds = new Set(existingTransactions.map(t => t.appointmentId));
    console.log(`✅ [FIX] Found ${existingTransactions.length} existing transactions`);

    // Filter appointments that don't have transactions
    const missingTransactions = completedAppointments.filter(
      a => !existingAppointmentIds.has(a.id)
    );

    console.log(`⚠️ [FIX] Found ${missingTransactions.length} appointments without transactions`);

    if (missingTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No missing transactions found',
        created: 0,
        appointments: []
      });
    }

    // Create missing transactions
    const createdTransactions = [];
    for (const appointment of missingTransactions) {
      try {
        // Use appointment date as transaction date
        const transaction = await prisma.transaction.create({
          data: {
            tenantId: appointment.tenantId,
            type: 'appointment',
            amount: appointment.price || 0,
            description: `Randevu: ${appointment.serviceName} - ${appointment.customerName}`,
            paymentType: appointment.paymentType || 'cash',
            customerId: appointment.customerId,
            customerName: appointment.customerName,
            appointmentId: appointment.id,
            date: appointment.date, // Use appointment date
            profit: 0
          }
        });

        createdTransactions.push({
          transactionId: transaction.id,
          appointmentId: appointment.id,
          customerName: appointment.customerName,
          serviceName: appointment.serviceName,
          amount: appointment.price,
          date: appointment.date
        });

        console.log(`✅ [FIX] Created transaction for appointment ${appointment.id}: ${appointment.customerName} - ₺${appointment.price}`);
      } catch (error) {
        console.error(`❌ [FIX] Failed to create transaction for appointment ${appointment.id}:`, error);
      }
    }

    console.log(`🎉 [FIX] Created ${createdTransactions.length} transactions`);

    return NextResponse.json({
      success: true,
      message: `Created ${createdTransactions.length} missing transactions`,
      created: createdTransactions.length,
      transactions: createdTransactions
    });

  } catch (error) {
    console.error('❌ [FIX] Error fixing missing transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix missing transactions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Preview missing transactions without creating them
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const date = searchParams.get('date');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId is required' },
        { status: 400 }
      );
    }

    // Find completed appointments
    const whereCondition: any = {
      tenantId,
      status: { in: ['completed', 'confirmed'] },
      price: { gt: 0 },
      packageInfo: null
    };

    if (date) {
      whereCondition.date = date;
    }

    const completedAppointments = await prisma.appointment.findMany({
      where: whereCondition,
      select: {
        id: true,
        customerName: true,
        serviceName: true,
        price: true,
        date: true,
        status: true
      }
    });

    // Get existing transactions
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        type: 'appointment',
        appointmentId: { in: completedAppointments.map(a => a.id) }
      },
      select: { appointmentId: true }
    });

    const existingAppointmentIds = new Set(existingTransactions.map(t => t.appointmentId));

    // Filter missing
    const missingTransactions = completedAppointments.filter(
      a => !existingAppointmentIds.has(a.id)
    );

    const totalMissingAmount = missingTransactions.reduce((sum, a) => sum + (a.price || 0), 0);

    return NextResponse.json({
      success: true,
      totalCompleted: completedAppointments.length,
      existingTransactions: existingTransactions.length,
      missingCount: missingTransactions.length,
      totalMissingAmount,
      missingAppointments: missingTransactions
    });

  } catch (error) {
    console.error('Error previewing missing transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to preview' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
