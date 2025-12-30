import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token and get user info
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userType: string;
      tenantId: string;
      customerId?: string;
      staffId?: string;
      ownerId?: string;
      phone?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get appointments
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let whereClause: any = {};

    // Customer - can see appointments from ALL tenants where they have records
    if (auth.userType === 'customer' && auth.customerId) {
      console.log('📱 [CUSTOMER] Looking up customerId:', auth.customerId);

      // Find all customer IDs with the same phone across tenants
      const customer = await prisma.customer.findUnique({
        where: { id: auth.customerId },
        select: { phone: true }
      });

      console.log('📱 [CUSTOMER] Found customer:', customer);

      if (customer?.phone) {
        // Normalize phone for matching - get last 10 digits
        const phoneDigits = customer.phone.replace(/\D/g, '');
        const phoneLastDigits = phoneDigits.slice(-10);

        console.log('📱 [CUSTOMER] Phone:', customer.phone, 'Last 10:', phoneLastDigits);

        // Get all customer records with matching phone (last 10 digits)
        const allCustomerRecords = await prisma.customer.findMany({
          where: {
            phone: {
              contains: phoneLastDigits
            }
          },
          select: { id: true }
        });

        console.log('📱 [CUSTOMER] Found customer records:', allCustomerRecords.length, allCustomerRecords.map(c => c.id));

        const customerIds = allCustomerRecords.map(c => c.id);
        if (customerIds.length > 0) {
          whereClause.customerId = { in: customerIds };
        } else {
          whereClause.customerId = auth.customerId;
        }
      } else {
        // Customer not found or has no phone - return empty
        console.log('📱 [CUSTOMER] Customer not found or no phone, using customerId:', auth.customerId);
        whereClause.customerId = auth.customerId;
      }
    } else if (auth.userType === 'customer' && auth.phone) {
      // Fallback: use phone from token if customerId not set
      console.log('📱 [CUSTOMER] Using phone from token:', auth.phone);
      const phoneDigits = auth.phone.replace(/\D/g, '');
      const phoneLastDigits = phoneDigits.slice(-10);

      const allCustomerRecords = await prisma.customer.findMany({
        where: {
          phone: {
            contains: phoneLastDigits
          }
        },
        select: { id: true }
      });

      console.log('📱 [CUSTOMER] Found customer records by phone:', allCustomerRecords.length);

      const customerIds = allCustomerRecords.map(c => c.id);
      if (customerIds.length > 0) {
        whereClause.customerId = { in: customerIds };
      } else {
        // No customers found - return empty list
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
    } else {
      // Staff/Owner - only see appointments from their tenant
      whereClause.tenantId = auth.tenantId;

      // If staff (not owner), only show their appointments
      if (auth.userType === 'staff' && auth.staffId) {
        whereClause.staffId = auth.staffId;
      }
    }

    if (date) {
      whereClause.date = date;
    }

    if (status) {
      whereClause.status = status;
    }

    // Use raw query approach - get appointments without requiring valid relations
    // This ensures deleted/inactive tenants, services, staff don't break the query
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    });

    console.log('📋 [APPOINTMENTS] Found appointments:', appointments.length);

    // Get tenant info separately to handle deleted tenants
    const tenantIds = [...new Set(appointments.map(apt => apt.tenantId))];
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, businessName: true, status: true },
    });
    const tenantMap = new Map(tenants.map(t => [t.id, t]));

    const formattedAppointments = appointments.map((apt: any) => {
      const tenant = tenantMap.get(apt.tenantId);

      // Determine tenant status for UI display
      let tenantStatus = 'active';
      let tenantName = apt.serviceName ? `${apt.serviceName} - İşletme` : 'Bilinmiyor';

      if (tenant) {
        tenantName = tenant.businessName;
        tenantStatus = tenant.status || 'active';
      } else {
        tenantStatus = 'deleted';
        tenantName = 'Silinmiş İşletme';
      }

      return {
        id: apt.id,
        tenantId: apt.tenantId,
        tenantName: tenantName,
        tenantStatus: tenantStatus, // 'active', 'inactive', 'deleted'
        customerId: apt.customerId,
        customerName: apt.customerName || 'Bilinmiyor',
        customerPhone: apt.customerPhone || '',
        customerEmail: apt.customerEmail || '',
        serviceId: apt.serviceId,
        serviceName: apt.serviceName || 'Bilinmiyor',
        staffId: apt.staffId,
        staffName: apt.staffName || 'Bilinmiyor',
        date: apt.date,
        time: apt.time,
        duration: apt.duration || 0,
        status: apt.status,
        notes: apt.notes,
        price: apt.price || 0,
        paymentType: apt.paymentType,
        createdAt: apt.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: apt.updatedAt?.toISOString() || new Date().toISOString(),
      };
    });

    console.log('📋 [APPOINTMENTS] Formatted:', formattedAppointments.length);

    return NextResponse.json({
      success: true,
      data: formattedAppointments,
    });
  } catch (error: any) {
    console.error('❌ Get appointments error:', error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create appointment
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { serviceId, staffId, date, time, notes, customerName, customerPhone } = body;

    if (!serviceId || !staffId || !date || !time) {
      return NextResponse.json(
        { success: false, message: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // For customers, get tenantId from header (they don't have tenantId in token)
    let tenantId = auth.tenantId;
    if (auth.userType === 'customer') {
      const headerTenantId = request.headers.get('X-Tenant-ID');
      if (!headerTenantId) {
        return NextResponse.json(
          { success: false, message: 'Tenant ID gerekli' },
          { status: 400 }
        );
      }
      tenantId = headerTenantId;
    }

    // Get customer ID (for customer user type)
    let customerId = auth.customerId;

    // For customer user type, find or create customer record in target tenant
    if (auth.userType === 'customer') {
      // Check if this is a new customer (isNewCustomer flag in token)
      const isNewCustomer = (auth as any).isNewCustomer;

      if (isNewCustomer || !auth.customerId) {
        // New customer - create customer record using phone from token and name from body
        const phone = auth.phone;
        if (!phone) {
          return NextResponse.json(
            { success: false, message: 'Telefon bilgisi bulunamadı' },
            { status: 400 }
          );
        }

        // Get customer name from body (set during onboarding)
        const firstName = body.customerFirstName || 'Müşteri';
        const lastName = body.customerLastName || '';

        // Find or create customer record in the target tenant
        let targetCustomer = await prisma.customer.findFirst({
          where: {
            tenantId: tenantId,
            phone: {
              contains: phone.slice(-10),
            },
          },
        });

        if (!targetCustomer) {
          // Create new customer record
          targetCustomer = await prisma.customer.create({
            data: {
              tenantId: tenantId,
              firstName,
              lastName,
              phone,
              email: `${phone}@temp.com`,
              status: 'active',
            },
          });
          console.log('📱 [APPOINTMENT] Created new customer:', targetCustomer.id);
        }

        customerId = targetCustomer.id;
      } else {
        // Existing customer - get phone from their record
        const originalCustomer = await prisma.customer.findUnique({
          where: { id: auth.customerId },
          select: { phone: true, firstName: true, lastName: true, email: true }
        });

        if (!originalCustomer?.phone) {
          return NextResponse.json(
            { success: false, message: 'Müşteri telefon bilgisi bulunamadı' },
            { status: 400 }
          );
        }

        // Find or create customer record in the target tenant
        let targetCustomer = await prisma.customer.findFirst({
          where: {
            tenantId: tenantId,
            phone: originalCustomer.phone,
          },
        });

        if (!targetCustomer) {
          // Create customer record in target tenant
          targetCustomer = await prisma.customer.create({
            data: {
              tenantId: tenantId,
              firstName: originalCustomer.firstName,
              lastName: originalCustomer.lastName,
              phone: originalCustomer.phone,
              email: originalCustomer.email || `${originalCustomer.phone}@temp.com`,
              status: 'active',
            },
          });
        }

        customerId = targetCustomer.id;
      }
    }

    // If staff/owner creating appointment, find or create customer
    if (!customerId && (auth.userType === 'staff' || auth.userType === 'owner')) {
      if (!customerName || !customerPhone) {
        return NextResponse.json(
          { success: false, message: 'Müşteri adı ve telefonu gerekli' },
          { status: 400 }
        );
      }

      // Try to find existing customer by phone
      let customer = await prisma.customer.findFirst({
        where: {
          tenantId: tenantId,
          phone: customerPhone,
        },
      });

      // If not found, create new customer
      if (!customer) {
        const nameParts = customerName.trim().split(' ');
        const firstName = nameParts[0] || customerName;
        const lastName = nameParts.slice(1).join(' ') || '';

        customer = await prisma.customer.create({
          data: {
            tenantId: tenantId,
            firstName,
            lastName,
            phone: customerPhone,
            email: `${customerPhone}@temp.com`,
            status: 'active',
          },
        });
      }

      customerId = customer.id;
    }

    // Fallback to body.customerId if provided
    if (!customerId) {
      customerId = body.customerId;
    }

    // Check for conflicting appointments
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Hizmet bulunamadı' },
        { status: 404 }
      );
    }

    // Check if time slot is available
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        staffId,
        date,
        time,
        status: {
          notIn: ['cancelled'],
        },
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { success: false, message: 'Bu saat dolu' },
        { status: 400 }
      );
    }

    // Get staff info for staffName
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, message: 'Personel bulunamadı' },
        { status: 404 }
      );
    }

    // Get customer info for customerName
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: tenantId,
        customerId,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        customerPhone: customer.phone || '',
        serviceId,
        serviceName: service.name,
        staffId,
        staffName: `${staff.firstName} ${staff.lastName}`.trim(),
        date,
        time,
        duration: service.duration,
        price: service.price,
        notes,
        status: 'pending',
        paymentType: 'cash',
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
            price: true,
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Randevu oluşturuldu',
      data: {
        id: appointment.id,
        customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
        serviceName: appointment.service.name,
        staffName: `${appointment.staff.firstName} ${appointment.staff.lastName}`,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
      },
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
