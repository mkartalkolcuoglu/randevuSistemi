import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userType: string;
      tenantId?: string;
      customerId?: string;
      phone?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get customer profile
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    if (auth.userType !== 'customer') {
      return NextResponse.json(
        { success: false, message: 'Bu işlem sadece müşteriler için' },
        { status: 403 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: auth.customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        birthDate: true,
        gender: true,
        address: true,
        notes: true,
        createdAt: true,
      }
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Check if profile is complete (firstName and lastName required)
    const isProfileComplete = !!(customer.firstName && customer.lastName);

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        isProfileComplete,
      }
    });
  } catch (error) {
    console.error('Get customer profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Update customer profile
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    if (auth.userType !== 'customer') {
      return NextResponse.json(
        { success: false, message: 'Bu işlem sadece müşteriler için' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, birthDate, gender, address } = body;

    // Validation
    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: 'Ad ve soyad zorunludur' },
        { status: 400 }
      );
    }

    // Get original customer to find phone
    const originalCustomer = await prisma.customer.findUnique({
      where: { id: auth.customerId },
      select: { phone: true }
    });

    if (!originalCustomer) {
      return NextResponse.json(
        { success: false, message: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Update all customer records with the same phone number across all tenants
    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };

    if (email !== undefined) updateData.email = email?.trim() || null;
    if (birthDate !== undefined) updateData.birthDate = birthDate || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (address !== undefined) updateData.address = address?.trim() || null;

    // Update all records with same phone
    await prisma.customer.updateMany({
      where: { phone: originalCustomer.phone },
      data: updateData
    });

    // Get updated customer
    const updatedCustomer = await prisma.customer.findUnique({
      where: { id: auth.customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        birthDate: true,
        gender: true,
        address: true,
        notes: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profil güncellendi',
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Update customer profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
