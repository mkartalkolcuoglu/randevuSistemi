import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const appointmentData = await request.json();
    console.log('Received appointment data:', appointmentData);
    
    // Tenant ID'sini bul
    const tenant = await prisma.tenant.findUnique({
      where: { slug: appointmentData.tenantSlug },
      select: { id: true }
    });
    
    if (!tenant) {
      return NextResponse.json({
        success: false,
        error: 'Tenant bulunamadı'
      }, { status: 404 });
    }
    
    // Service ID'sini bul (serviceName ile)
    const service = await prisma.service.findFirst({
      where: {
        tenantId: tenant.id,
        name: appointmentData.serviceName
      },
      select: { id: true, name: true, price: true, duration: true }
    });
    
    if (!service) {
      return NextResponse.json({
        success: false,
        error: 'Hizmet bulunamadı'
      }, { status: 404 });
    }
    
    // Staff bilgisini bul
    const staff = await prisma.staff.findUnique({
      where: { id: appointmentData.staffId },
      select: { id: true, firstName: true, lastName: true }
    });
    
    if (!staff) {
      return NextResponse.json({
        success: false,
        error: 'Personel bulunamadı'
      }, { status: 404 });
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
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        serviceId: service.id,
        staffId: staff.id,
        date: appointmentData.date,
        time: appointmentData.time,
        duration: appointmentData.duration || service.duration,
        price: appointmentData.price || service.price,
        status: 'pending',
        paymentType: 'cash',
        notes: appointmentData.customerInfo?.notes || appointmentData.notes || '',
        customerName: appointmentData.customerInfo?.name || appointmentData.customerName || `${customer.firstName} ${customer.lastName}`
      }
    });
    
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
