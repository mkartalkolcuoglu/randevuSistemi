import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'https://randevu-sistemi-admin.vercel.app';

export async function POST(request: NextRequest) {
  console.log('🚀 Web Appointment API - Proxying to Admin API');
  
  try {
    const appointmentData = await request.json();
    console.log('📥 Received appointment request for tenant:', appointmentData.tenantSlug);
    
    // Proxy to Admin API
    const adminApiUrl = `${ADMIN_API_URL}/api/appointments`;
    console.log('🔄 Forwarding to:', adminApiUrl);
    
    const adminResponse = await fetch(adminApiUrl, {
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
    
    console.log('📡 Admin API response status:', adminResponse.status);
    
    if (!adminResponse.ok) {
      const errorText = await adminResponse.text();
      console.error('❌ Admin API error:', adminResponse.status, errorText);
      return NextResponse.json({
        success: false,
        error: `Randevu oluşturulamadı: ${errorText}`
      }, { status: adminResponse.status });
    }
    
    const result = await adminResponse.json();
    console.log('✅ Admin API result:', result.success ? 'Success' : 'Failed');
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Randevu başarıyla oluşturuldu',
        data: {
          id: result.data?.id || `apt_${Date.now()}`,
          customerName: appointmentData.customerInfo?.name || appointmentData.customerName,
          serviceName: appointmentData.serviceName,
          staffName: result.data?.staffName || 'Personel',
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
    console.error('❌ Appointment creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Randevu oluşturulurken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')
    }, { status: 500 });
  }
}
