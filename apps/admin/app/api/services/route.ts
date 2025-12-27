import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { checkApiPermission } from '../../../lib/api-auth';

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

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID bulunamadı' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';

    // Build where clause with tenant filter
    const where: any = {
      tenantId: tenantId
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (category !== 'all') {
      where.category = category;
    }

    // Get total count
    const total = await prisma.service.count({ where });

    // Get paginated data
    const services = await prisma.service.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: services,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('Error fetching services:', error);
    console.error('Error details:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check permission
    const permissionCheck = await checkApiPermission(request, 'services', 'create');
    if (!permissionCheck.authorized) {
      return permissionCheck.error!;
    }

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
    
    const newService = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        duration: parseInt(data.duration),
        category: data.category || '',
        status: data.status || 'active',
        tenantId: tenantId
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: newService 
    });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service' },
      { status: 400 }
    );
  }
}