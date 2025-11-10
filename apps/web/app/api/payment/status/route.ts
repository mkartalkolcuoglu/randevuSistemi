import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantOid = searchParams.get('merchant_oid');

    if (!merchantOid) {
      return NextResponse.json(
        { success: false, error: 'merchant_oid is required' },
        { status: 400 }
      );
    }

    // Find payment by merchant_oid
    const payment = await prisma.payment.findUnique({
      where: { merchantOid }
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Get appointment details if appointmentId exists
    let appointmentDetails = null;
    if (payment.appointmentId) {
      appointmentDetails = await prisma.appointment.findUnique({
        where: { id: payment.appointmentId }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentStatus: payment.status,
        amount: payment.amount,
        customerName: payment.customerName,
        customerEmail: payment.customerEmail,
        customerPhone: payment.customerPhone,
        paidAt: payment.paidAt,
        // Appointment details
        ...appointmentDetails && {
          serviceName: appointmentDetails.serviceName,
          staffName: appointmentDetails.staffName,
          date: appointmentDetails.date,
          time: appointmentDetails.time,
          price: appointmentDetails.price
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
