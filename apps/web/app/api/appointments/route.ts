import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Health check for this endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/appointments',
    methods: ['POST'],
    message: 'Appointment API is ready. Use POST method to create appointments.'
  });
}

export async function POST(request: NextRequest) {
  console.log('🚀 Web Appointment API - Direct Database Write');
  
  try {
    const appointmentData = await request.json();
    console.log('📥 Received appointment request for tenant:', appointmentData.tenantSlug);
    
    // Find tenant by slug
    console.log('🔍 Step 1: Looking for tenant:', appointmentData.tenantSlug);
    const tenant = await prisma.tenant.findUnique({
      where: { slug: appointmentData.tenantSlug },
      select: { id: true }
    });
    
    if (!tenant) {
      console.error('❌ Tenant not found:', appointmentData.tenantSlug);
      return NextResponse.json({
        success: false,
        error: 'Tenant not found'
      }, { status: 404 });
    }
    
    console.log('✅ Tenant found:', tenant.id);
    
    // Find service by name
    console.log('🔍 Step 2: Looking for service:', appointmentData.serviceName);
    const service = await prisma.service.findFirst({
      where: {
        tenantId: tenant.id,
        name: appointmentData.serviceName
      },
      select: { id: true, name: true, price: true, duration: true }
    });
    
    if (!service) {
      console.error('❌ Service not found:', appointmentData.serviceName);
      return NextResponse.json({
        success: false,
        error: `Service not found: ${appointmentData.serviceName}`
      }, { status: 404 });
    }
    
    console.log('✅ Service found:', service.id);
    
    // Find staff
    console.log('🔍 Step 3: Looking for staff:', appointmentData.staffId);
    const staff = await prisma.staff.findUnique({
      where: { id: appointmentData.staffId },
      select: { id: true, firstName: true, lastName: true }
    });
    
    if (!staff) {
      console.error('❌ Staff not found:', appointmentData.staffId);
      return NextResponse.json({
        success: false,
        error: `Staff not found: ${appointmentData.staffId}`
      }, { status: 404 });
    }
    
    console.log('✅ Staff found:', `${staff.firstName} ${staff.lastName}`);
    
    // Find or create customer
    console.log('🔍 Step 4: Finding/creating customer');
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { email: appointmentData.customerEmail || '' },
          { phone: appointmentData.customerPhone || '' }
        ]
      }
    });
    
    if (!customer) {
      const customerName = appointmentData.customerInfo?.name || appointmentData.customerName || 'Web Müşteri';
      const [firstName, ...lastNameParts] = customerName.split(' ');
      
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          firstName: firstName || 'Web',
          lastName: lastNameParts.join(' ') || 'Müşteri',
          email: appointmentData.customerInfo?.email || appointmentData.customerEmail || '',
          phone: appointmentData.customerInfo?.phone || appointmentData.customerPhone || '',
          birthDate: null,
          gender: null,
          address: null
        }
      });
      console.log('✅ Customer created:', customer.id);
    } else {
      console.log('✅ Customer found:', customer.id);
    }
    
    // Create appointment
    console.log('💾 Step 5: Creating appointment');
    console.log('🎁 Package info from request:', appointmentData.packageInfo);
    console.log('📦 Use package flag:', appointmentData.usePackageForService);
    
    const appointment = await prisma.appointment.create({
      data: {
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
        notes: appointmentData.customerInfo?.notes || appointmentData.notes || '',
        // Store package info if user wants to use package
        packageInfo: (appointmentData.usePackageForService && appointmentData.packageInfo) 
          ? JSON.stringify(appointmentData.packageInfo) 
          : null
      }
    });
    
    console.log('✅ Appointment created with ID:', appointment.id);
    console.log('📦 PackageInfo saved:', appointment.packageInfo ? 'Yes' : 'No');
    
    console.log('✅ Appointment created successfully:', appointment.id);
    
    return NextResponse.json({
      success: true,
      message: 'Randevu başarıyla oluşturuldu',
      data: {
        id: appointment.id,
        customerName: appointment.customerName,
        serviceName: appointment.serviceName,
        staffName: appointment.staffName,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    return NextResponse.json({
      success: false,
      error: 'Randevu oluşturulurken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata')
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
