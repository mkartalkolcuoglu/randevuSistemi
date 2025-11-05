import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Telefon numarası gereklidir' },
        { status: 400 }
      );
    }

    console.log('📞 Fetching appointments for phone:', phone);

    // Telefon numarasına göre randevuları getir (tüm tenant'lardan)
    const appointments = await prisma.appointment.findMany({
      where: {
        customerPhone: phone
      },
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ]
    });

    console.log(`✅ Found ${appointments.length} appointments for phone ${phone}`);

    // Her randevu için tenant bilgisini ekle
    const appointmentsWithTenant = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          const tenant = await prisma.tenant.findUnique({
            where: { id: appointment.tenantId },
            select: { businessName: true, slug: true }
          });

          return {
            ...appointment,
            tenantName: tenant?.businessName || 'Bilinmeyen İşletme',
            tenantSlug: tenant?.slug || ''
          };
        } catch (error) {
          console.error('Error fetching tenant:', error);
          return {
            ...appointment,
            tenantName: 'Bilinmeyen İşletme',
            tenantSlug: ''
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

