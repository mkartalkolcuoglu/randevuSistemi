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

// GET - Get single customer by ID
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

    // Only staff and owners can view customer details
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: customer.id,
        tenantId: customer.tenantId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        birthDate: customer.birthDate?.toISOString(),
        gender: customer.gender,
        address: customer.address,
        notes: customer.notes,
        status: customer.status,
        isBlacklisted: customer.isBlacklisted,
        noShowCount: customer.noShowCount,
        createdAt: customer.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Update customer
export async function PUT(
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

    // Only staff and owners can update customers
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if customer exists and belongs to tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, message: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, email, birthDate, gender, address, notes, status, isBlacklisted } = body;

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { success: false, message: 'Ad, soyad ve telefon gerekli' },
        { status: 400 }
      );
    }

    // Check if phone is used by another customer
    const phoneInUse = await prisma.customer.findFirst({
      where: {
        tenantId: auth.tenantId,
        phone,
        id: { not: id },
      },
    });

    if (phoneInUse) {
      return NextResponse.json(
        { success: false, message: 'Bu telefon numarası başka bir müşteriye ait' },
        { status: 400 }
      );
    }

    // Parse birthDate if provided
    let parsedBirthDate = existingCustomer.birthDate;
    if (birthDate) {
      try {
        parsedBirthDate = new Date(birthDate);
      } catch (e) {
        console.error('Error parsing birthDate:', e);
      }
    } else if (birthDate === null || birthDate === '') {
      parsedBirthDate = null;
    }

    // Prepare email - keep existing if new one is empty/placeholder
    let customerEmail = existingCustomer.email;
    if (email && email.trim() && !email.includes('@placeholder.local') && !email.includes('@temp.local')) {
      customerEmail = email.trim();
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        email: customerEmail,
        birthDate: parsedBirthDate,
        gender: gender || null,
        address: address || null,
        notes: notes || null,
        status: status || existingCustomer.status,
        isBlacklisted: isBlacklisted !== undefined ? isBlacklisted : existingCustomer.isBlacklisted,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Müşteri güncellendi',
      data: {
        id: updatedCustomer.id,
        firstName: updatedCustomer.firstName,
        lastName: updatedCustomer.lastName,
        phone: updatedCustomer.phone,
      },
    });
  } catch (error: any) {
    console.error('Update customer error:', error);

    // Check for unique constraint violation
    if (error?.code === 'P2002') {
      const target = error?.meta?.target;
      if (target?.includes('email')) {
        return NextResponse.json(
          { success: false, message: 'Bu e-posta adresi başka bir müşteriye ait' },
          { status: 400 }
        );
      }
      if (target?.includes('phone')) {
        return NextResponse.json(
          { success: false, message: 'Bu telefon numarası başka bir müşteriye ait' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer
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

    // Only staff and owners can delete customers
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if customer exists and belongs to tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, message: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Check if customer has any appointments
    const appointmentCount = await prisma.appointment.count({
      where: {
        customerId: id,
      },
    });

    if (appointmentCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Bu müşterinin ${appointmentCount} randevusu var. Önce randevuları silmeniz gerekiyor.`
        },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Müşteri silindi',
    });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
