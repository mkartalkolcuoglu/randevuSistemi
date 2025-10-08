import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  console.log('🚀 Appointment API called');
  
  try {
    // Step 1: Parse request
    console.log('📥 Step 1: Parsing request...');
    const appointmentData = await request.json();
    console.log('✅ Request parsed:', appointmentData);
    
    // Step 2: Test database connection
    console.log('🔌 Step 2: Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Step 3: Find tenant
    console.log('🔍 Step 3: Looking for tenant with slug:', appointmentData.tenantSlug);
    const tenant = await prisma.tenant.findUnique({
      where: { slug: appointmentData.tenantSlug },
      select: { id: true, businessName: true }
    });
    console.log('✅ Tenant query result:', tenant);
    
    if (!tenant) {
      console.log('❌ Tenant not found for slug:', appointmentData.tenantSlug);
      return NextResponse.json({
        success: false,
        error: `Tenant bulunamadı: ${appointmentData.tenantSlug}`
      }, { status: 404 });
    }
    
    // Service ID'sini bul (serviceName ile - case insensitive)
    console.log('🔍 Looking for service:', appointmentData.serviceName, 'for tenant:', tenant.id);
    
    // Önce exact match dene
    let service = await prisma.service.findFirst({
      where: {
        tenantId: tenant.id,
        name: appointmentData.serviceName
      },
      select: { id: true, name: true, price: true, duration: true }
    });
    
    // Exact match bulunamazsa, case-insensitive dene
    if (!service) {
      console.log('🔍 Trying case-insensitive search for service:', appointmentData.serviceName);
      const allServices = await prisma.service.findMany({
        where: { tenantId: tenant.id },
        select: { id: true, name: true, price: true, duration: true }
      });
      
      console.log('🔍 Available services:', allServices.map(s => s.name));
      
      service = allServices.find(s => 
        s.name.toLowerCase().includes(appointmentData.serviceName.toLowerCase()) ||
        appointmentData.serviceName.toLowerCase().includes(s.name.toLowerCase())
      );
    }
    
    console.log('🔍 Found service:', service);
    
    if (!service) {
      console.log('❌ Service not found:', appointmentData.serviceName);
      
      // Mevcut servisleri listele
      const availableServices = await prisma.service.findMany({
        where: { tenantId: tenant.id },
        select: { name: true }
      });
      
      return NextResponse.json({
        success: false,
        error: `Hizmet bulunamadı: "${appointmentData.serviceName}". Mevcut hizmetler: ${availableServices.map(s => s.name).join(', ')}`
      }, { status: 404 });
    }
    
    // Staff bilgisini bul
    console.log('🔍 Looking for staff with ID:', appointmentData.staffId);
    const staff = await prisma.staff.findUnique({
      where: { id: appointmentData.staffId },
      select: { id: true, firstName: true, lastName: true, tenantId: true }
    });
    
    console.log('🔍 Found staff:', staff);
    
    if (!staff) {
      console.log('❌ Staff not found with ID:', appointmentData.staffId);
      
      // Mevcut staff'ları listele
      const availableStaff = await prisma.staff.findMany({
        where: { tenantId: tenant.id },
        select: { id: true, firstName: true, lastName: true }
      });
      
      return NextResponse.json({
        success: false,
        error: `Personel bulunamadı: ${appointmentData.staffId}. Mevcut personel: ${availableStaff.map(s => `${s.firstName} ${s.lastName} (${s.id})`).join(', ')}`
      }, { status: 404 });
    }
    
    // Staff'ın tenant'a ait olduğunu kontrol et
    if (staff.tenantId !== tenant.id) {
      console.log('❌ Staff belongs to different tenant:', staff.tenantId, 'vs', tenant.id);
      return NextResponse.json({
        success: false,
        error: 'Personel bu salona ait değil'
      }, { status: 403 });
    }
    
    // Customer'ı bul veya oluştur
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { email: appointmentData.customerEmail },
          { phone: appointmentData.customerPhone }
        ]
      }
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          firstName: appointmentData.customerInfo?.name?.split(' ')[0] || appointmentData.customerName?.split(' ')[0] || 'Web',
          lastName: appointmentData.customerInfo?.name?.split(' ').slice(1).join(' ') || appointmentData.customerName?.split(' ').slice(1).join(' ') || 'Müşteri',
          email: appointmentData.customerInfo?.email || appointmentData.customerEmail || '',
          phone: appointmentData.customerInfo?.phone || appointmentData.customerPhone || '',
          birthDate: null,
          gender: null,
          address: null
        }
      });
    }
    
    // Randevu oluştur
    console.log('💾 Step 4: Creating appointment...');
    const appointmentCreateData = {
      tenantId: tenant.id,
      customerId: customer.id,
      customerName: appointmentData.customerInfo?.name || appointmentData.customerName || `${customer.firstName} ${customer.lastName}`,
      customerPhone: appointmentData.customerInfo?.phone || appointmentData.customerPhone || customer.phone || '',
      customerEmail: appointmentData.customerInfo?.email || appointmentData.customerEmail || customer.email || '',
      serviceId: service.id,
      serviceName: service.name,
      staffId: staff.id,
      staffName: `${staff.firstName} ${staff.lastName}`,
      date: appointmentData.date,
      time: appointmentData.time,
      duration: appointmentData.duration || service.duration,
      price: appointmentData.price || service.price,
      status: 'pending',
      paymentType: 'cash',
      notes: appointmentData.customerInfo?.notes || appointmentData.notes || ''
    };
    
    console.log('💾 Appointment data to create:', appointmentCreateData);
    
    const appointment = await prisma.appointment.create({
      data: appointmentCreateData
    });
    
    console.log('✅ Appointment created successfully:', appointment.id);
    
    return NextResponse.json({
      success: true,
      message: 'Randevu başarıyla oluşturuldu',
      data: {
        id: appointment.id,
        customerName: appointment.customerName,
        serviceName: service.name,
        staffName: `${staff.firstName} ${staff.lastName}`,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status
      }
    });
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({
      success: false,
      error: 'Randevu oluşturulurken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
