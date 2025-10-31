import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkApiPermission } from '../../../lib/api-auth';

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
    // Get tenant ID and user info from session cookie (for admin panel)
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-session');
    
    let sessionTenantId = null;
    let userType = null;
    let sessionStaffId = null;
    
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        sessionTenantId = sessionData.tenantId;
        userType = sessionData.userType || 'owner';
        sessionStaffId = sessionData.staffId || null;
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
    const staffId = searchParams.get('staffId') || '';
    const customerId = searchParams.get('customerId') || '';
    const tenantId = searchParams.get('tenantId') || sessionTenantId || '';
    
    console.log('📊 Fetching appointments with Prisma');
    console.log('🔍 Session tenant ID:', sessionTenantId);
    console.log('🔍 User type:', userType);
    console.log('🔍 Session staff ID:', sessionStaffId);
    console.log('🔍 Query tenant ID:', tenantId);
    console.log('🔍 Search params:', { page, limit, search, status, date, staffId, customerId });

    // Build Prisma where clause
    const where: any = {};
    
    // Filter by tenant
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    // IMPORTANT: If user is staff, only show their own appointments
    if (userType === 'staff' && sessionStaffId) {
      where.staffId = sessionStaffId;
      console.log('👤 Staff user detected - filtering by staffId:', sessionStaffId);
    } 
    // Otherwise, allow explicit staffId filter (for owners)
    else if (staffId) {
      where.staffId = staffId;
    }
    
    // Filter by customer
    if (customerId) {
      where.customerId = customerId;
    }
    
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

    // Check if this is from web app (tenant appointment) - allow without permission check
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
      
      // Find or create customer (don't use upsert until Prisma client is updated)
      let customer;
      if (data.customerEmail) {
        // If email provided, try to find existing customer first
        customer = await prisma.customer.findFirst({
          where: {
            tenantId: tenant.id,
            email: data.customerEmail
          }
        });
        
        if (customer) {
          // Update existing customer
          customer = await prisma.customer.update({
            where: { id: customer.id },
            data: {
              firstName,
              lastName,
              phone: data.customerPhone || customer.phone
            }
          });
          console.log('📝 Updated existing customer:', customer.id);
        } else {
          // Create new customer
          customer = await prisma.customer.create({
            data: {
              tenantId: tenant.id,
              firstName,
              lastName,
              email: data.customerEmail,
              phone: data.customerPhone || '',
              status: 'active'
            }
          });
          console.log('✨ Created new customer:', customer.id);
        }
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
              email: `${data.customerPhone}@noemail.com`,
              phone: data.customerPhone,
              status: 'active'
            }
          });
          console.log('✨ Created phone-only customer:', customer.id);
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
        console.log('✨ Created guest customer:', customer.id);
      }
      
      console.log('👤 Customer:', customer.id);
      
      // Create appointment
      console.log('🎁 Package info:', data.packageInfo);
      console.log('📦 Use package:', data.usePackageForService);
      
      // Extract serviceId from packageInfo if available, otherwise use provided serviceId
      const actualServiceId = (data.usePackageForService && data.packageInfo?.serviceId) 
        ? data.packageInfo.serviceId 
        : (data.serviceId || 'web-service');

      console.log('🔍 Service ID:', actualServiceId);

      const newAppointment = await prisma.appointment.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone || '',
          customerEmail: data.customerEmail || '',
          serviceId: actualServiceId,
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
          // Store package info if user wants to use package
          packageInfo: (data.usePackageForService && data.packageInfo) 
            ? JSON.stringify(data.packageInfo) 
            : null,
        }
      });

      console.log('✅ Appointment created:', newAppointment.id, 'with package:', data.usePackageForService);

      // Create notification for new appointment (non-blocking)
      console.log('🔔 [APPOINTMENT] Creating notification for tenantId:', tenant.id);
      prisma.notification.create({
        data: {
          tenantId: tenant.id,
          type: 'new_appointment',
          title: 'Yeni Randevu',
          message: `${data.customerName} - ${data.serviceName} (${data.date} ${data.time})`,
          link: `/admin/appointments/${newAppointment.id}`
        }
      }).then(notification => {
        console.log('🔔 [APPOINTMENT] Notification created:', notification.id);
      }).catch(error => {
        console.error('🔔 [APPOINTMENT] Failed to create notification:', error);
      });

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
    
    // Check permission for creating appointments
    const permissionCheck = await checkApiPermission(request, 'appointments', 'create');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }
    
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

    // Create notification for new appointment (non-blocking)
    console.log('🔔 [ADMIN-APPOINTMENT] Creating notification for tenantId:', customer.tenantId);
    prisma.notification.create({
      data: {
        tenantId: customer.tenantId,
        type: 'new_appointment',
        title: 'Yeni Randevu',
        message: `${customer.firstName} ${customer.lastName} - ${service.name} (${data.date} ${data.time})`,
        link: `/admin/appointments/${newAppointment.id}`
      }
    }).then(notification => {
      console.log('🔔 [ADMIN-APPOINTMENT] Notification created:', notification.id);
    }).catch(error => {
      console.error('🔔 [ADMIN-APPOINTMENT] Failed to create notification:', error);
    });

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