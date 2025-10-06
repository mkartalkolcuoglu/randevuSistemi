import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get tenant ID from cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz oturum' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    // Build where clause with tenant filter
    const where: any = {
      tenantId: tenantId
    };
    
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { position: { contains: search } }
      ];
    }
    
    if (status !== 'all') {
      where.status = status;
    }

    // Get total count
    const total = await prisma.staff.count({ where });

    // Get paginated data
    const staff = await prisma.staff.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Add appointment statistics for each staff member
    const staffWithStats = await Promise.all(
      staff.map(async (staffMember) => {
        try {
          // Get current month appointments
          const currentDate = new Date();
          const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          
          // Get all appointments for this staff member (simplified for now)
          const monthlyAppointments = await prisma.appointment.count({
            where: {
              staffId: staffMember.id
            }
          });

          // Calculate total revenue from all appointments
          const monthlyAppointmentData = await prisma.appointment.findMany({
            where: {
              staffId: staffMember.id
            },
            select: {
              price: true
            }
          });

          const monthlyRevenue = monthlyAppointmentData.reduce(
            (sum, appointment) => sum + (appointment.price || 0), 
            0
          );

          return {
            ...staffMember,
            monthlyAppointments,
            monthlyRevenue
          };
        } catch (error) {
          console.error('Error calculating stats for staff:', staffMember.id, error);
          return {
            ...staffMember,
            monthlyAppointments: 0,
            monthlyRevenue: 0
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: staffWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Get tenant ID from cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('tenant-session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    let tenantId;
    try {
      const sessionData = JSON.parse(sessionCookie.value);
      tenantId = sessionData.tenantId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz oturum' },
        { status: 401 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID bulunamadı' },
        { status: 401 }
      );
    }
    
    const newStaff = await prisma.staff.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        position: data.position,
        status: data.status || 'active',
        tenantId: tenantId,
        salary: data.salary ? parseFloat(data.salary) : null,
        hireDate: data.hireDate || null,
        specializations: data.specializations ? JSON.stringify(data.specializations) : null,
        experience: data.experience ? parseInt(data.experience) : null,
        rating: data.rating ? parseFloat(data.rating) : 4.0,
        workingHours: data.workingHours ? JSON.stringify(data.workingHours) : null,
        notes: data.notes || null
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: newStaff 
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create staff' },
      { status: 400 }
    );
  }
}