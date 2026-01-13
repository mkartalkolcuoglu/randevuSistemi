import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, phone } = body;

    if (!appointmentId || !phone) {
      return NextResponse.json(
        { success: false, error: 'Randevu ID ve telefon numarası gerekli' },
        { status: 400 }
      );
    }

    // Format phone for comparison
    const formattedPhone = phone.replace(/^0/, '').replace(/\s/g, '');

    // Find the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Verify customer owns this appointment
    const customer = await prisma.customer.findUnique({
      where: { id: appointment.customerId }
    });

    if (!customer || !customer.phone.includes(formattedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Bu randevuyu iptal etme yetkiniz yok' },
        { status: 403 }
      );
    }

    // Check if appointment can be cancelled (at least 2 hours before)
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 2) {
      return NextResponse.json(
        { success: false, error: 'Randevu saatine 2 saatten az kaldığı için iptal edilemez' },
        { status: 400 }
      );
    }

    // Check if already cancelled or completed
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Bu randevu zaten iptal edilmiş' },
        { status: 400 }
      );
    }

    if (appointment.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Tamamlanmış randevu iptal edilemez' },
        { status: 400 }
      );
    }

    // Cancel the appointment
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'cancelled',
        notes: appointment.notes
          ? `${appointment.notes}\n[Müşteri tarafından iptal edildi - ${new Date().toLocaleString('tr-TR')}]`
          : `[Müşteri tarafından iptal edildi - ${new Date().toLocaleString('tr-TR')}]`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Randevu başarıyla iptal edildi'
    });

  } catch (error) {
    console.error('Appointment cancel error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Randevu iptal edilirken bir hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
