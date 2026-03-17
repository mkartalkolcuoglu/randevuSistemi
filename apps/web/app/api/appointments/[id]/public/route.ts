import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        customerName: true,
        serviceName: true,
        staffName: true,
        date: true,
        time: true,
        status: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Randevu bulunamadi' },
        { status: 404 }
      );
    }

    if (appointment.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Bu randevu henuz tamamlanmamis' },
        { status: 400 }
      );
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { appointmentId: id },
    });

    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { id: appointment.tenantId },
      select: { businessName: true, slug: true, logo: true, primaryColor: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...appointment,
        hasFeedback: !!existingFeedback,
        tenant,
      },
    });
  } catch (error) {
    console.error('Public appointment fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Bir hata olustu' },
      { status: 500 }
    );
  }
}
