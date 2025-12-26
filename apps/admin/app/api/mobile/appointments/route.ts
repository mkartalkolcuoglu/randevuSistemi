import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
    const { serviceId, staffId, date, time, notes } = body;

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

    // If staff/owner creating appointment, customerId should be provided
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

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: auth.tenantId,
        customerId,
        serviceId,
        staffId,
        date,
        time,
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
