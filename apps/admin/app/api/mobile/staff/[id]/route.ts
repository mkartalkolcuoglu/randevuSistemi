import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
      staffId?: string;
      ownerId?: string;
      phone?: string;
    };
    return decoded;
  } catch (err) {
    return null;
  }
}

// GET - Get single staff by ID
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

    // Note: services relation temporarily disabled - _ServiceToStaff table doesn't exist
    const staff = await prisma.staff.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, message: 'Personel bulunamadı' },
        { status: 404 }
      );
    }

    // Parse workingHours if it's a string
    let workingHours = null;
    if (staff.workingHours) {
      try {
        workingHours = typeof staff.workingHours === 'string'
          ? JSON.parse(staff.workingHours as string)
          : staff.workingHours;
      } catch (e) {
        console.error('Error parsing staff workingHours:', e);
      }
    }

    // Parse specializations
    let specializations: string[] = [];
    if (staff.specializations) {
      try {
        if (typeof staff.specializations === 'string') {
          try {
            specializations = JSON.parse(staff.specializations);
          } catch {
            specializations = staff.specializations.split(',').map(sp => sp.trim()).filter(Boolean);
          }
        } else if (Array.isArray(staff.specializations)) {
          specializations = staff.specializations;
        }
      } catch (e) {
        console.error('Error parsing staff specializations:', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: staff.id,
        tenantId: staff.tenantId,
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        position: staff.position,
        status: staff.status,
        avatar: staff.avatar,
        salary: staff.salary,
        hireDate: staff.hireDate,
        specializations,
        experience: staff.experience,
        rating: staff.rating,
        workingHours,
        notes: staff.notes,
        username: staff.username,
        canLogin: staff.canLogin,
        role: staff.role,
        permissions: staff.permissions,
        services: [], // Temporarily empty - _ServiceToStaff table doesn't exist
        isActive: staff.status === 'active',
        createdAt: staff.createdAt.toISOString(),
        updatedAt: staff.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get staff error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Update staff
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

    // Only staff and owners can update staff
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if staff exists and belongs to tenant
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, message: 'Personel bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      status,
      salary,
      hireDate,
      specializations,
      experience,
      rating,
      workingHours,
      notes,
      username,
      password,
      canLogin,
      role,
      permissions,
      serviceIds,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !position) {
      return NextResponse.json(
        { success: false, message: 'Ad, soyad, e-posta ve pozisyon zorunludur' },
        { status: 400 }
      );
    }

    // Check if email is used by another staff
    if (email !== existingStaff.email) {
      const emailInUse = await prisma.staff.findFirst({
        where: {
          email,
          id: { not: id },
        },
      });

      if (emailInUse) {
        return NextResponse.json(
          { success: false, message: 'Bu e-posta adresi başka bir personele ait' },
          { status: 400 }
        );
      }
    }

    // Check if username is used by another staff
    if (username && username !== existingStaff.username) {
      const usernameInUse = await prisma.staff.findFirst({
        where: {
          username,
          id: { not: id },
        },
      });

      if (usernameInUse) {
        return NextResponse.json(
          { success: false, message: 'Bu kullanıcı adı başka bir personele ait' },
          { status: 400 }
        );
      }
    }

    // Hash password if provided
    let hashedPassword = existingStaff.password;
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Format specializations
    const formattedSpecializations = Array.isArray(specializations)
      ? specializations.join(',')
      : specializations || existingStaff.specializations;

    // Update staff
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        position: position.trim(),
        status: status || existingStaff.status,
        salary: salary !== undefined ? (salary ? parseFloat(salary) : null) : existingStaff.salary,
        hireDate: hireDate !== undefined ? hireDate : existingStaff.hireDate,
        specializations: formattedSpecializations,
        experience: experience !== undefined ? (experience ? parseInt(experience) : null) : existingStaff.experience,
        rating: rating !== undefined ? (rating ? parseFloat(rating) : null) : existingStaff.rating,
        workingHours: workingHours !== undefined ? (workingHours ? JSON.stringify(workingHours) : null) : existingStaff.workingHours,
        notes: notes !== undefined ? (notes?.trim() || null) : existingStaff.notes,
        username: username !== undefined ? (username?.trim() || null) : existingStaff.username,
        password: hashedPassword,
        canLogin: canLogin !== undefined ? canLogin : existingStaff.canLogin,
        role: role || existingStaff.role,
        permissions: permissions !== undefined ? permissions : existingStaff.permissions,
        services: serviceIds !== undefined ? {
          set: serviceIds.map((sid: string) => ({ id: sid })),
        } : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Personel güncellendi',
      data: {
        id: updatedStaff.id,
        firstName: updatedStaff.firstName,
        lastName: updatedStaff.lastName,
        email: updatedStaff.email,
        position: updatedStaff.position,
        status: updatedStaff.status,
        isActive: updatedStaff.status === 'active',
      },
    });
  } catch (error: any) {
    console.error('Update staff error:', error);

    // Check for unique constraint violation
    if (error?.code === 'P2002') {
      const target = error?.meta?.target;
      if (target?.includes('email')) {
        return NextResponse.json(
          { success: false, message: 'Bu e-posta adresi başka bir personele ait' },
          { status: 400 }
        );
      }
      if (target?.includes('username')) {
        return NextResponse.json(
          { success: false, message: 'Bu kullanıcı adı başka bir personele ait' },
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

// PATCH - Toggle staff status
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

    // Only staff and owners can toggle staff status
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if staff exists and belongs to tenant
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, message: 'Personel bulunamadı' },
        { status: 404 }
      );
    }

    // Check request body for specific status or toggle
    const body = await request.json().catch(() => ({}));
    let newStatus: string;

    if (body.status) {
      // Set specific status
      newStatus = body.status;
    } else {
      // Toggle between active and inactive
      newStatus = existingStaff.status === 'active' ? 'inactive' : 'active';
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: { status: newStatus },
    });

    const statusMessages: { [key: string]: string } = {
      active: 'Personel aktif edildi',
      inactive: 'Personel pasif yapıldı',
      vacation: 'Personel izinli olarak işaretlendi',
    };

    return NextResponse.json({
      success: true,
      message: statusMessages[newStatus] || 'Personel durumu güncellendi',
      data: {
        id: updatedStaff.id,
        status: updatedStaff.status,
        isActive: updatedStaff.status === 'active',
      },
    });
  } catch (error: any) {
    console.error('Toggle staff status error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete staff
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

    // Only staff and owners can delete staff
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if staff exists and belongs to tenant
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, message: 'Personel bulunamadı' },
        { status: 404 }
      );
    }

    // Check if staff has any upcoming appointments
    const appointmentCount = await prisma.appointment.count({
      where: {
        staffId: id,
        date: {
          gte: new Date().toISOString().split('T')[0],
        },
        status: {
          in: ['pending', 'confirmed'],
        },
      },
    });

    if (appointmentCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Bu personelin ${appointmentCount} aktif randevusu var. Önce randevuları iptal etmeniz veya başka bir personele atamanız gerekiyor.`
        },
        { status: 400 }
      );
    }

    await prisma.staff.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Personel silindi',
    });
  } catch (error: any) {
    console.error('Delete staff error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}
