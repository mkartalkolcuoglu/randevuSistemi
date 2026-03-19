import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { verifySessionToken } from '../../../otp/verify/route';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Session cookie doğrulama
    const sessionCookie = request.cookies.get('customer-session');
    let phone: string | null = null;

    if (sessionCookie) {
      const session = verifySessionToken(sessionCookie.value);
      if (session) phone = session.phone;
    }

    // Geriye uyumluluk: cookie yoksa body'den al
    if (!phone) {
      const body = await request.json();
      phone = body.phone;
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    console.log(`🚫 Cancel request for appointment ${id} from phone ${phone}`);

    // Randevuyu getir
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Telefon numarası kontrolü
    if (appointment.customerPhone !== phone) {
      return NextResponse.json(
        { success: false, error: 'Bu randevuyu iptal etme yetkiniz yok' },
        { status: 403 }
      );
    }

    // Status kontrolü - cancelled ve completed iptal edilemez
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Bu randevu iptal edilemez' },
        { status: 400 }
      );
    }

    // 6 saat kontrolü
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    const timeDiff = appointmentDateTime.getTime() - now.getTime();

    if (timeDiff < sixHoursInMs) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Randevuya 6 saatten az kaldığı için iptal edilemez' 
        },
        { status: 400 }
      );
    }

    // Randevuyu iptal et
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    console.log(`✅ Appointment ${id} cancelled successfully`);

    // İşletmeye bildirim oluştur
    try {
      await prisma.notification.create({
        data: {
          tenantId: appointment.tenantId,
          type: 'appointment_cancelled',
          title: 'Randevu İptal Edildi',
          message: `${appointment.customerName} adlı müşteri ${appointment.date} ${appointment.time} tarihli ${appointment.serviceName} randevusunu iptal etti.`,
          link: `/admin/appointments`,
          read: false
        }
      });
      console.log(`✅ Notification created for tenant ${appointment.tenantId}`);
    } catch (notifError) {
      console.error('⚠️ Failed to create notification:', notifError);
      // Bildirim hatası randevu iptalini engellemez
    }

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      message: 'Randevu başarıyla iptal edildi'
    });

  } catch (error) {
    console.error('❌ Error cancelling appointment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Randevu iptal edilirken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

