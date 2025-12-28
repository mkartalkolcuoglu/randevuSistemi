import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper to verify token and get user info
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No auth header or invalid format');
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      phone?: string;
      userType: string;
      tenantId: string;
      staffId?: string;
      ownerId?: string;
      customerId?: string;
    };
    console.log('Token decoded:', { userType: decoded.userType, tenantId: decoded.tenantId });
    return decoded;
  } catch (err: any) {
    console.log('Token verification failed:', err?.message);
    return null;
  }
}

// GET - Get staff list
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
    const serviceId = searchParams.get('serviceId');
    const includeAll = searchParams.get('includeAll') === 'true';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

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

    // Build where clause
    const whereClause: any = {
      tenantId: tenantId,
    };

    // Status filter
    if (!includeAll && status === 'all') {
      whereClause.status = 'active';
    } else if (status !== 'all') {
      whereClause.status = status;
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          AND: [
            { phone: { not: null } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        },
        { position: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Service filter - disabled because _ServiceToStaff table doesn't exist
    // When staff-service relation is implemented, uncomment this:
    // if (serviceId) {
    //   whereClause.services = {
    //     some: {
    //       id: serviceId,
    //     },
    //   };
    // }
    const staff = await prisma.staff.findMany({
      where: whereClause,
      orderBy: { firstName: 'asc' },
    });

    const formattedStaff = staff.map((s) => {
      // Parse workingHours if it's a string
      let workingHours = null;
      if (s.workingHours) {
        try {
          workingHours = typeof s.workingHours === 'string'
            ? JSON.parse(s.workingHours as string)
            : s.workingHours;
        } catch (e) {
          console.error('Error parsing staff workingHours:', e);
        }
      }

      // Parse specializations
      let specializations: string[] = [];
      if (s.specializations) {
        try {
          if (typeof s.specializations === 'string') {
            // Try JSON parse first, then split by comma
            try {
              specializations = JSON.parse(s.specializations);
            } catch {
              specializations = s.specializations.split(',').map(sp => sp.trim()).filter(Boolean);
            }
          } else if (Array.isArray(s.specializations)) {
            specializations = s.specializations;
          }
        } catch (e) {
          console.error('Error parsing staff specializations:', e);
        }
      }

      return {
        id: s.id,
        tenantId: s.tenantId,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        phone: s.phone,
        position: s.position,
        status: s.status,
        avatar: s.avatar,
        salary: s.salary,
        hireDate: s.hireDate,
        specializations,
        experience: s.experience,
        rating: s.rating,
        workingHours,
        notes: s.notes,
        canLogin: s.canLogin,
        role: s.role,
        services: [], // Temporarily empty - _ServiceToStaff table doesn't exist
        isActive: s.status === 'active',
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedStaff,
      total: formattedStaff.length,
    });
  } catch (error: any) {
    console.error('Get staff error:', error?.message || error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu', error: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new staff
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'Yetkilendirme gerekli' },
        { status: 401 }
      );
    }

    // Only staff and owners can create staff
    if (auth.userType === 'customer') {
      return NextResponse.json(
        { success: false, message: 'Erişim yetkisi yok' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      status = 'active',
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

    // Check if email already exists
    const existingStaff = await prisma.staff.findFirst({
      where: {
        email,
        tenantId: auth.tenantId,
      },
    });

    if (existingStaff) {
      return NextResponse.json(
        { success: false, message: 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Check if username exists (if provided)
    if (username) {
      const existingUsername = await prisma.staff.findFirst({
        where: { username },
      });

      if (existingUsername) {
        return NextResponse.json(
          { success: false, message: 'Bu kullanıcı adı zaten kullanılıyor' },
          { status: 400 }
        );
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password && canLogin) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Format specializations
    const formattedSpecializations = Array.isArray(specializations)
      ? specializations.join(',')
      : specializations || null;

    // Create staff
    const newStaff = await prisma.staff.create({
      data: {
        tenantId: auth.tenantId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        position: position.trim(),
        status,
        salary: salary ? parseFloat(salary) : null,
        hireDate: hireDate || null,
        specializations: formattedSpecializations,
        experience: experience ? parseInt(experience) : null,
        rating: rating ? parseFloat(rating) : 4.0,
        workingHours: workingHours ? JSON.stringify(workingHours) : null,
        notes: notes?.trim() || null,
        username: username?.trim() || null,
        password: hashedPassword,
        canLogin: canLogin || false,
        role: role || 'staff',
        permissions: permissions || null,
        services: serviceIds?.length > 0 ? {
          connect: serviceIds.map((id: string) => ({ id })),
        } : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Personel oluşturuldu',
      data: {
        id: newStaff.id,
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        email: newStaff.email,
        position: newStaff.position,
        status: newStaff.status,
      },
    });
  } catch (error: any) {
    console.error('Create staff error:', error);

    // Check for unique constraint violation
    if (error?.code === 'P2002') {
      const target = error?.meta?.target;
      if (target?.includes('email')) {
        return NextResponse.json(
          { success: false, message: 'Bu e-posta adresi zaten kullanılıyor' },
          { status: 400 }
        );
      }
      if (target?.includes('username')) {
        return NextResponse.json(
          { success: false, message: 'Bu kullanıcı adı zaten kullanılıyor' },
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
