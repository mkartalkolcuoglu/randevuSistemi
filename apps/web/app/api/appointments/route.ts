import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const appointmentData = await request.json();
    
    // Admin panel API'sine randevu gönder
    const adminResponse = await fetch('http://localhost:3001/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantSlug: appointmentData.tenantSlug,
        customerName: appointmentData.customerInfo?.name || appointmentData.customerName || 'Web Müşteri',
        customerEmail: appointmentData.customerInfo?.email || appointmentData.customerEmail || '',
        customerPhone: appointmentData.customerInfo?.phone || appointmentData.customerPhone || '',
        serviceName: appointmentData.serviceName,
        staffId: appointmentData.staffId,
        date: appointmentData.date,
        time: appointmentData.time,
        duration: appointmentData.duration,
        price: appointmentData.price,
        notes: appointmentData.customerInfo?.notes || appointmentData.notes || '',
        paymentType: 'cash',
        status: 'pending'
      }),
    });

    if (!adminResponse.ok) {
      throw new Error(`Admin panel API error: ${adminResponse.status}`);
    }

    const result = await adminResponse.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Randevu başarıyla oluşturuldu',
        data: {
          id: result.data?.id || `apt_${Date.now()}`,
          customerName: appointmentData.customerName,
          serviceName: appointmentData.serviceName,
          staffName: result.data?.staffName || 'Bilinmeyen Personel',
          date: appointmentData.date,
          time: appointmentData.time,
          status: 'pending'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Randevu oluşturulamadı'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({
      success: false,
      error: 'Randevu oluşturulurken hata oluştu'
    }, { status: 500 });
  }
}
