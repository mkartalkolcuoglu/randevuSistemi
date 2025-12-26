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
      customerId?: string;
      staffId?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
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
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Check access
    if (appointment.tenantId !== auth.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    if (auth.userType === 'customer' && appointment.customerId !== auth.customerId) {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: appointment.id,
        tenantId: appointment.tenantId,
        customerId: appointment.customerId,
        customerName: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
        customerPhone: appointment.customer.phone,
        customerEmail: appointment.customer.email,
        serviceId: appointment.serviceId,
        serviceName: appointment.service.name,
        staffId: appointment.staffId,
        staffName: `${appointment.staff.firstName} ${appointment.staff.lastName}`,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.service.duration,
        status: appointment.status,
        notes: appointment.notes,
        price: appointment.service.price,
        paymentType: appointment.paymentType,
        createdAt: appointment.createdAt.toISOString(),
        updatedAt: appointment.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PATCH - Update appointment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Check access
    if (appointment.tenantId !== auth.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    // Customers can only cancel their own appointments
    if (auth.userType === 'customer') {
      if (appointment.customerId !== auth.customerId) {
        return NextResponse.json(
          { success: false, message: 'Erişim yetkisi yok' },
          { status: 403 }
        );
      }

      if (status !== 'cancelled') {
        return NextResponse.json(
          { success: false, message: 'Sadece iptal işlemi yapabilirsiniz' },
          { status: 400 }
        );
      }
    }

    // Staff can only update their own appointments (unless owner)
    if (auth.userType === 'staff' && appointment.staffId !== auth.staffId) {
      return NextResponse.json(
        { success: false, message: 'Sadece kendi randevularınızı güncelleyebilirsiniz' },
        { status: 403 }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz durum' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Randevu güncellendi',
      data: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
      },
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Randevu bulunamadı' },
        { status: 404 }
      );
    }

    // Check access
    if (appointment.tenantId !== auth.tenantId) {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    if (auth.userType === 'customer' && appointment.customerId !== auth.customerId) {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    // Cancel instead of delete
    await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({
      success: true,
      message: 'Randevu iptal edildi',
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
