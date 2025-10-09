import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    // Get tenant ID from session cookie (for admin panel)
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-session');
    
    let sessionTenantId = null;
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        sessionTenantId = sessionData.tenantId;
      } catch (error) {
        // Session cookie is invalid, continue without tenant filter
      }
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const date = searchParams.get('date') || '';
    const tenantId = searchParams.get('tenantId') || sessionTenantId || '';
    
    console.log('📊 Fetching appointments with Prisma');
    console.log('🔍 Session tenant ID:', sessionTenantId);
    console.log('🔍 Query tenant ID:', tenantId);
    console.log('🔍 Search params:', { page, limit, search, status, date });

    // Build Prisma where clause
    const where: any = {};
    
    // TEMPORARILY DISABLE TENANT FILTER FOR DEBUGGING
    // if (tenantId) {
    //   where.tenantId = tenantId;
    // }
    
    console.log('🔍 Where clause:', JSON.stringify(where));
    
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { serviceName: { contains: search, mode: 'insensitive' } },
        { staffName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status !== 'all') {
      where.status = status;
    }
    
    if (date) {
      where.date = date;
    }
    
    // Get total count
    const total = await prisma.appointment.count({ where });
    console.log('📊 Total appointments found:', total);
    
    // Get appointments
    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { time: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });
    
    console.log('📊 Returning', appointments.length, 'appointments');
    if (appointments.length > 0) {
      console.log('📊 First appointment:', appointments[0]);
    }

    return NextResponse.json({
      success: true,
      data: appointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('📥 Creating appointment with data:', data);

    // Check if this is from web app (tenant appointment)
    if (data.tenantSlug) {
      console.log('🌐 Web appointment for tenant:', data.tenantSlug);
      
      // Find tenant by slug
      const tenant = await prisma.tenant.findUnique({
        where: { slug: data.tenantSlug }
      });
      
      if (!tenant) {
        console.error('❌ Tenant not found for slug:', data.tenantSlug);
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404, headers: corsHeaders }
        );
      }
      
      // Check for time conflicts
      const conflictCheck = await prisma.appointment.findFirst({
        where: {
          staffId: data.staffId,
          date: data.date,
          time: data.time,
          status: { not: 'cancelled' }
        }
      });
      
      if (conflictCheck) {
        console.error('⚠️ Time conflict detected');
        return NextResponse.json(
          { success: false, error: 'Bu tarih ve saatte seçili personelin başka bir randevusu var' },
          { status: 409, headers: corsHeaders }
        );
      }
      
      // Get staff info
      const staff = await prisma.staff.findUnique({
        where: { id: data.staffId },
        select: { firstName: true, lastName: true }
      });
      const staffName = staff ? `${staff.firstName} ${staff.lastName}` : 'Bilinmeyen Personel';
      
      // Split customer name
      const nameParts = data.customerName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Use email or phone as unique identifier
      const customerIdentifier = data.customerEmail || data.customerPhone || `guest_${Date.now()}`;
      
      // Create or find customer using upsert (handles email uniqueness per tenant)
      let customer;
      if (data.customerEmail) {
        // If email provided, upsert by tenantId + email composite key
        customer = await prisma.customer.upsert({
          where: { 
            tenantId_email: {
              tenantId: tenant.id,
              email: data.customerEmail
            }
          },
          update: {
            firstName,
            lastName,
            phone: data.customerPhone || '',
          },
          create: {
            tenantId: tenant.id,
            firstName,
            lastName,
            email: data.customerEmail,
            phone: data.customerPhone || '',
            status: 'active'
          }
        });
      } else if (data.customerPhone) {
        // If only phone provided, find or create by phone
        customer = await prisma.customer.findFirst({
          where: {
            phone: data.customerPhone,
            tenantId: tenant.id
          }
        });
        
        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              tenantId: tenant.id,
              firstName,
              lastName,
              email: `${data.customerPhone}@noemail.com`, // Generate unique email
              phone: data.customerPhone,
              status: 'active'
            }
          });
        }
      } else {
        // Guest customer without email or phone
        customer = await prisma.customer.create({
          data: {
            tenantId: tenant.id,
            firstName,
            lastName,
            email: `guest_${Date.now()}@noemail.com`,
            phone: '',
            status: 'active'
          }
        });
      }
      
      console.log('👤 Customer:', customer.id);
      
      // Create appointment
      const newAppointment = await prisma.appointment.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone || '',
          customerEmail: data.customerEmail || '',
          serviceId: data.serviceId || 'web-service',
          serviceName: data.serviceName,
          staffId: data.staffId,
          staffName: staffName,
          date: data.date,
          time: data.time,
          status: data.status || 'pending',
          notes: data.notes || '',
          price: data.price || 0,
          duration: data.duration || 60,
          paymentType: data.paymentType || 'cash',
        }
      });

      console.log('✅ Appointment created:', newAppointment.id);

      return NextResponse.json({
        success: true,
        message: 'Appointment created successfully',
        data: {
          id: newAppointment.id,
          staffName: newAppointment.staffName,
          customerName: newAppointment.customerName,
          serviceName: newAppointment.serviceName,
          date: newAppointment.date,
          time: newAppointment.time,
          status: newAppointment.status
        },
      }, { headers: corsHeaders });
    }

    // Admin panel appointment creation
    console.log('🔧 Admin appointment creation');
    
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId }
    });
    
    const staff = await prisma.staff.findUnique({
      where: { id: data.staffId }
    });
    
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    });

    if (!service || !staff || !customer) {
      console.error('❌ Service, staff, or customer not found');
      return NextResponse.json(
        { success: false, error: 'Service, staff, or customer not found' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check for conflicts
    const conflictCheck = await prisma.appointment.findFirst({
      where: {
        staffId: data.staffId,
        date: data.date,
        time: data.time,
        status: { not: 'cancelled' }
      }
    });
    
    if (conflictCheck) {
      console.error('⚠️ Time conflict detected');
      return NextResponse.json(
        { success: false, error: 'Bu tarih ve saatte seçili personelin başka bir randevusu var' },
        { status: 409, headers: corsHeaders }
      );
    }
    
    const newAppointment = await prisma.appointment.create({
      data: {
        tenantId: customer.tenantId,
        customerId: data.customerId,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerPhone: customer.phone || '',
        customerEmail: customer.email,
        serviceId: data.serviceId,
        serviceName: service.name,
        staffId: data.staffId,
        staffName: `${staff.firstName} ${staff.lastName}`,
        date: data.date,
        time: data.time,
        status: data.status || 'scheduled',
        notes: data.notes || '',
        price: service.price,
        duration: service.duration,
        paymentType: data.paymentType || 'cash',
      }
    });

    console.log('✅ Admin appointment created:', newAppointment.id);

    return NextResponse.json({
      success: true,
      message: 'Appointment created successfully',
      data: newAppointment,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: `Randevu oluşturulurken hata oluştu: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}