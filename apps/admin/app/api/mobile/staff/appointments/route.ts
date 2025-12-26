import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
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
      staffId?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get staff appointments
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can access this
    if (auth.userType !== 'staff' && auth.userType !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId: auth.tenantId,
    };

    // If staff (not owner), only show their appointments
    if (auth.userType === 'staff' && auth.staffId) {
      where.staffId = auth.staffId;
    }

    if (date) {
      where.date = date;
    }

    if (status) {
      where.status = status;
    }

    // Get appointments - use denormalized fields (no relations in this schema)
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
        select: {
          id: true,
          tenantId: true,
          customerId: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          staffId: true,
          staffName: true,
          serviceId: true,
          serviceName: true,
          date: true,
          time: true,
          duration: true,
          status: true,
          price: true,
          notes: true,
          paymentType: true,
          createdAt: true,
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    // Format appointments
    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      tenantId: apt.tenantId,
      customerId: apt.customerId,
      customerName: apt.customerName || 'Bilinmiyor',
      customerPhone: apt.customerPhone,
      customerEmail: apt.customerEmail,
      staffId: apt.staffId,
      staffName: apt.staffName || 'Bilinmiyor',
      serviceId: apt.serviceId,
      serviceName: apt.serviceName || 'Bilinmiyor',
      date: apt.date,
      time: apt.time,
      duration: apt.duration || 30,
      status: apt.status,
      price: apt.price || 0,
      notes: apt.notes,
      paymentType: apt.paymentType,
      createdAt: apt.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedAppointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Get staff appointments error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message || String(error) },
      { status: 500 }
    );
  }
}

// POST - Create appointment for customer (staff/owner)
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can create appointments
    if (auth.userType !== 'staff' && auth.userType !== 'owner') {
      return NextResponse.json(
        { success: false, message: 'Bu işlem için yetkiniz yok' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      staffId,
      date,
      time,
      notes,
      paymentType,
    } = body;

    // Validate required fields
    if (!serviceId || !staffId || !date || !time) {
      return NextResponse.json(
        { success: false, message: 'Hizmet, personel, tarih ve saat gerekli' },
        { status: 400 }
      );
    }

    // Get service for duration and price
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        duration: true,
        price: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Hizmet bulunamadı' },
        { status: 404 }
      );
    }

    // Get staff name
    const staffRecord = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { firstName: true, lastName: true },
    });

    if (!staffRecord) {
      return NextResponse.json(
        { success: false, message: 'Personel bulunamadı' },
        { status: 404 }
      );
    }

    let finalCustomerId = customerId;
    let finalCustomerName = customerName || 'Misafir';
    let finalCustomerPhone = customerPhone;
    let finalCustomerEmail = customerEmail;

    // If no customerId but have phone, find or create customer
    if (!finalCustomerId && customerPhone) {
      const phoneDigits = customerPhone.replace(/\D/g, '').slice(-10);

      let customer = await prisma.customer.findFirst({
        where: {
          tenantId: auth.tenantId,
          phone: {
            contains: phoneDigits,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
        },
      });

      if (!customer && customerName) {
        const nameParts = customerName.split(' ');
        customer = await prisma.customer.create({
          data: {
            tenantId: auth.tenantId,
            firstName: nameParts[0] || 'Misafir',
            lastName: nameParts.slice(1).join(' ') || '',
            phone: customerPhone,
            email: customerEmail,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        });
      }

      if (customer) {
        finalCustomerId = customer.id;
        finalCustomerName = `${customer.firstName} ${customer.lastName}`;
        finalCustomerPhone = customer.phone;
        finalCustomerEmail = customer.email;
      }
    }

    const staffName = `${staffRecord.firstName} ${staffRecord.lastName}`;

    // Create appointment with denormalized fields
    const appointment = await prisma.appointment.create({
      data: {
        tenantId: auth.tenantId,
        customerId: finalCustomerId || '',
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        customerEmail: finalCustomerEmail,
        staffId,
        staffName,
        serviceId,
        serviceName: service.name,
        date,
        time,
        duration: service.duration,
        price: service.price,
        status: 'confirmed',
        notes,
        paymentType: paymentType || 'cash',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Randevu oluşturuldu',
      data: {
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        customerName: finalCustomerName,
        staffName,
        serviceName: service.name,
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
