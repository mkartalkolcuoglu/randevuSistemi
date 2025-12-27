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
      phone: string;
      userType: string;
      tenantId: string;
      customerId?: string;
      staffId?: string;
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

    let whereClause: any = { tenantId: auth.tenantId };

    // If customer, only show their appointments
    if (auth.userType === 'customer' && auth.customerId) {
      whereClause.customerId = auth.customerId;
    }

    // If staff (not owner), only show their appointments
    if (auth.userType === 'staff' && auth.staffId) {
      whereClause.staffId = auth.staffId;
    }

    if (date) {
      whereClause.date = date;
    }

    if (status) {
      whereClause.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
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
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      tenantId: apt.tenantId,
      customerId: apt.customerId,
      customerName: `${apt.customer.firstName} ${apt.customer.lastName}`,
      customerPhone: apt.customer.phone,
      customerEmail: apt.customer.email,
      serviceId: apt.serviceId,
      serviceName: apt.service.name,
      staffId: apt.staffId,
      staffName: `${apt.staff.firstName} ${apt.staff.lastName}`,
      date: apt.date,
      time: apt.time,
      duration: apt.service.duration,
      status: apt.status,
      notes: apt.notes,
      price: apt.service.price,
      paymentType: apt.paymentType,
      createdAt: apt.createdAt.toISOString(),
      updatedAt: apt.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedAppointments,
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
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

    // Get customer ID (for customer user type)
    let customerId = auth.customerId;

    if (!customerId && auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Müşteri bilgisi bulunamadı' },
        { status: 400 }
      );
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
          tenantId: auth.tenantId,
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
            tenantId: auth.tenantId,
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
        tenantId: auth.tenantId,
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
