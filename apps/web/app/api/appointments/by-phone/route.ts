import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { formatPhoneForSMS } from '../../../../lib/netgsm-client';
import { verifySessionToken } from '../../otp/verify/route';

export async function GET(request: NextRequest) {
  try {
    // Session cookie doğrulama
    const sessionCookie = request.cookies.get('customer-session');
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadı. Lütfen tekrar doğrulama yapın.', code: 'NO_SESSION' },
        { status: 401 }
      );
    }

    const session = verifySessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Oturum süresi dolmuş. Lütfen tekrar doğrulama yapın.', code: 'SESSION_EXPIRED' },
        { status: 401 }
      );
    }

    // Session'daki telefon numarasını kullan (URL'den değil)
    const phone = session.phone;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gereklidir' },
        { status: 400 }
      );
    }

    console.log('📞 Fetching appointments for phone:', phone);

    // Telefon numarasını formatla (0'sız hale getir: 9053...)
    const formattedPhone = formatPhoneForSMS(phone);

    // Olası formatlar:
    // - 905XX (0 olmadan)
    // - 05XX (0 ile)
    // - 5XX (sadece numara)
    const phoneVariants = [
      formattedPhone,                    // 905XX...
      formattedPhone.replace('90', '0'), // 05XX...
      formattedPhone.replace('90', '')   // 5XX...
    ];

    console.log('🔍 Searching for phone variants:', phoneVariants);

    // Telefon numarasına göre randevuları getir (tüm varyantları dene)
    const appointments = await prisma.appointment.findMany({
      where: {
        OR: phoneVariants.map(variant => ({
          customerPhone: variant
        }))
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });

    console.log(`✅ Found ${appointments.length} appointments for phone ${phone}`);

    // Her randevu için tenant bilgisini ve feedback durumunu ekle
    const appointmentsWithTenant = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          const tenant = await prisma.tenant.findUnique({
            where: { id: appointment.tenantId },
            select: { businessName: true, slug: true }
          });

          // Feedback kontrolü
          const feedback = await prisma.feedback.findUnique({
            where: { appointmentId: appointment.id }
          });

          return {
            ...appointment,
            tenantName: tenant?.businessName || 'Bilinmeyen İşletme',
            tenantSlug: tenant?.slug || '',
            hasFeedback: !!feedback // Feedback verilmiş mi?
          };
        } catch (error) {
          console.error('Error fetching tenant:', error);
          return {
            ...appointment,
            tenantName: 'Bilinmeyen İşletme',
            tenantSlug: '',
            hasFeedback: false
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: appointmentsWithTenant
    });

  } catch (error) {
    console.error('❌ Error fetching appointments by phone:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Randevular getirilirken hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

